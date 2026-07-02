"""
AI Triage Engine Service for Apollo PFIP
P1/P2/P3 classification following Apollo protocols
"""

import re
from typing import Dict, List, Tuple, Optional
from datetime import datetime
import json
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.triage import TriageRecord, PriorityLevel, TriageSource
from app.models.patient import Patient
from app.models.encounter import Encounter


class TriageEngine:
    """
    AI-powered triage classification engine
    Implements Apollo's P1/P2/P3 protocols with keyword-based analysis
    """
    
    # Critical keywords for P1 (Red) - Immediate attention
    P1_KEYWORDS = {
        'cardiac': ['chest pain', 'heart attack', 'angina', 'palpitations', 'arrhythmia'],
        'respiratory': ['breathing difficulty', 'shortness of breath', 'suffocating', 'choking'],
        'neurological': ['stroke', 'paralysis', 'seizure', 'unconscious', 'severe headache'],
        'surgical': ['severe bleeding', 'major trauma', 'penetrating injury', 'amputation'],
        'obstetric': ['pregnancy bleeding', 'labor pain', 'ruptured membranes', 'pregnancy complications'],
        'general': ['severe', 'critical', 'emergency', 'collapse', 'unresponsive']
    }
    
    # Warning keywords for P2 (Yellow) - Urgent attention
    P2_KEYWORDS = {
        'pain': ['moderate pain', 'acute pain', 'worsening pain'],
        'fever': ['high fever', 'persistent fever'],
        'infection': ['severe infection', 'systemic infection'],
        'pediatric': ['child fever', 'child vomiting', 'child diarrhea'],
        'geriatric': ['elderly fall', 'elderly confusion'],
        'general': ['dizziness', 'vomiting', 'diarrhea', 'abdominal pain']
    }
    
    # Generic P3 keywords - Routine care
    P3_KEYWORDS = [
        'follow-up', 'routine', 'checkup', 'vaccination', 'prescription',
        'mild', 'minor', 'chronic', 'review', 'consultation'
    ]
    
    @staticmethod
    def normalize_text(text: str) -> str:
        """Normalize text for keyword matching"""
        return text.lower().strip()
    
    @staticmethod
    def contains_keywords(text: str, keyword_list: List[str]) -> bool:
        """Check if text contains any of the given keywords"""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in keyword_list)
    
    def classify_by_keywords(self, chief_complaint: str) -> Tuple[PriorityLevel, float, Dict]:
        """
        Classify priority based on keyword analysis
        Returns: (priority, confidence_score, keywords_found)
        """
        normalized_complaint = self.normalize_text(chief_complaint)
        
        # Check for P1 (Critical) keywords
        p1_keywords_found = []
        for category, keywords in self.P1_KEYWORDS.items():
            found = [kw for kw in keywords if kw in normalized_complaint]
            if found:
                p1_keywords_found.extend(found)
        
        if p1_keywords_found:
            confidence = min(1.0, len(p1_keywords_found) * 0.3 + 0.4)  # More keywords = higher confidence
            return PriorityLevel.P1, confidence, {"p1_keywords": p1_keywords_found}
        
        # Check for P2 (Urgent) keywords
        p2_keywords_found = []
        for category, keywords in self.P2_KEYWORDS.items():
            found = [kw for kw in keywords if kw in normalized_complaint]
            if found:
                p2_keywords_found.extend(found)
        
        if p2_keywords_found:
            confidence = min(1.0, len(p2_keywords_found) * 0.2 + 0.3)
            return PriorityLevel.P2, confidence, {"p2_keywords": p2_keywords_found}
        
        # Check for P3 (Routine) keywords
        p3_keywords_found = [kw for kw in self.P3_KEYWORDS if kw in normalized_complaint]
        
        if p3_keywords_found:
            confidence = min(1.0, len(p3_keywords_found) * 0.1 + 0.2)
            return PriorityLevel.P3, confidence, {"p3_keywords": p3_keywords_found}
        
        # Default - treat as P3 with lower confidence
        return PriorityLevel.P3, 0.1, {"default": ["no specific keywords found"]}
    
    def calculate_risk_factors(self, patient: Patient, encounter: Encounter) -> Dict:
        """
        Calculate risk factors based on patient demographics and health data
        Returns risk scores for different categories
        """
        risk_factors = {
            "cardiac_risk": 0.0,
            "respiratory_risk": 0.0,
            "neurological_risk": 0.0,
            "geriatric_risk": 0.0,
            "pediatric_risk": 0.0,
            "obstetric_risk": 0.0,
        }
        
        # Age-based risks
        age = self.calculate_age_from_dob(patient.date_of_birth)
        
        # Geriatric risk (65+)
        if age >= 65:
            risk_factors["geriatric_risk"] = 0.6
        
        # Pediatric risk (<12)
        if age < 12:
            risk_factors["pediatric_risk"] = 0.4
        
        # Pregnancy risk
        if patient.gender.lower() == "female" and encounter.extra_metadata:
            # Check pregnancy status from metadata
            pregnancy_status = encounter.extra_metadata.get("pregnancy_status", "").lower()
            if pregnancy_status in ["pregnant", "childbearing"]:
                risk_factors["obstetric_risk"] = 0.5
        
        # Medical history based risks
        if patient.medical_history:
            history_lower = patient.medical_history.lower()
            
            # Cardiac history
            if any(term in history_lower for term in ["heart", "cardiac", "hypertension", "high bp"]):
                risk_factors["cardiac_risk"] = 0.7
            
            # Respiratory history
            if any(term in history_lower for term in ["asthma", "copd", "respiratory", "lung"]):
                risk_factors["respiratory_risk"] = 0.6
            
            # Neurological history
            if any(term in history_lower for term in ["stroke", "seizure", "neurological", "brain"]):
                risk_factors["neurological_risk"] = 0.6
        
        return risk_factors
    
    def calculate_age_from_dob(self, dob_str: str) -> int:
        """Calculate age from date of birth string"""
        try:
            # Assuming format "YYYY-MM-DD" or similar
            if "-" in dob_str:
                year = int(dob_str.split("-")[0])
            else:
                # Try to extract year from various formats
                year_match = re.search(r'\b\d{4}\b', dob_str)
                year = int(year_match.group()) if year_match else 1980
        except (ValueError, AttributeError):
            year = 1980  # Default fallback
            
        current_year = datetime.now().year
        return current_year - year
    
    def analyze_symptoms(self, symptoms: List[str]) -> Dict:
        """Analyze symptoms for severity scoring"""
        severity_scores = []
        keywords_identified = []
        
        for symptom in symptoms:
            symptom_lower = symptom.lower()
            
            # Score severity based on keywords
            severity = 0.0
            
            # Severe indicators
            if any(term in symptom_lower for term in ["severe", "intense", "unbearable", "worst"]):
                severity += 0.8
            
            # Moderate indicators
            if any(term in symptom_lower for term in ["moderate", "significant", "considerable"]):
                severity += 0.5
            
            # Mild indicators
            if any(term in symptom_lower for term in ["mild", "slight", "minor"]):
                severity += 0.2
            
            severity_scores.append({
                "symptom": symptom,
                "severity": min(1.0, severity)  # Cap at 1.0
            })
            
            # Extract keywords
            for keyword in self.extract_keywords(symptom_lower):
                keywords_identified.append(keyword)
        
        return {
            "symptom_analysis": severity_scores,
            "keywords": list(set(keywords_identified)),
            "average_severity": sum(s["severity"] for s in severity_scores) / len(severity_scores) if severity_scores else 0.0
        }
    
    def extract_keywords(self, text: str) -> List[str]:
        """Extract medical keywords from text"""
        all_keywords = []
        
        # Extract P1 keywords
        for category in self.P1_KEYWORDS.values():
            all_keywords.extend(category)
        
        # Extract P2 keywords  
        for category in self.P2_KEYWORDS.values():
            all_keywords.extend(category)
        
        # Extract P3 keywords
        all_keywords.extend(self.P3_KEYWORDS)
        
        # Find matches
        found_keywords = []
        for keyword in all_keywords:
            if keyword in text:
                found_keywords.append(keyword)
        
        return found_keywords
    
    def get_suggested_department(self, chief_complaint: str, risk_factors: Dict) -> str:
        """Suggest appropriate department based on symptoms and risk factors"""
        complaint_lower = chief_complaint.lower()
        
        # Cardiac complaints
        if any(term in complaint_lower for term in ["chest", "heart", "bp", "palpitation"]):
            return "Cardiology"
        
        # Respiratory complaints
        if any(term in complaint_lower for term in ["breathing", "cough", "asthma", "lung"]):
            return "Pulmonology"
        
        # Neurological complaints
        if any(term in complaint_lower for term in ["headache", "dizziness", "seizure", "stroke"]):
            return "Neurology"
        
        # Surgical complaints
        if any(term in complaint_lower for term in ["injury", "trauma", "bleeding", "wound"]):
            return "Emergency Surgery"
        
        # Pediatric complaints
        if risk_factors.get("pediatric_risk", 0) > 0.3:
            return "Pediatrics"
        
        # Geriatric complaints
        if risk_factors.get("geriatric_risk", 0) > 0.5:
            return "Geriatrics"
        
        # Obstetric complaints
        if risk_factors.get("obstetric_risk", 0) > 0.4:
            return "Obstetrics & Gynecology"
        
        # Default
        return "General Medicine"
    
    async def create_triage_record(
        self, 
        db: AsyncSession,
        patient: Patient,
        encounter: Encounter,
        chief_complaint: str,
        symptoms: Optional[List[str]] = None,
        vital_signs: Optional[Dict] = None,
        nurse_id: Optional[int] = None
    ) -> TriageRecord:
        """
        Create a complete triage record with AI analysis
        
        This is the main entry point for triage functionality.
        It performs:
        1. Keyword-based priority classification
        2. Risk factor analysis
        3. Symptom analysis
        4. Department recommendation
        5. Creates the database record
        """
        
        # Step 1: AI Priority Classification
        priority, confidence, keywords_found = self.classify_by_keywords(chief_complaint)
        
        # Step 2: Risk Factor Analysis
        risk_factors = self.calculate_risk_factors(patient, encounter)
        
        # Step 3: Symptom Analysis
        symptom_analysis = self.analyze_symptoms(symptoms or [])
        
        # Step 4: Department Recommendation
        suggested_dept = self.get_suggested_department(chief_complaint, risk_factors)
        
        # Step 5: Create Triage Record
        triage_record = TriageRecord(
            encounter_id=encounter.id,
            patient_id=patient.id,
            triage_nurse_id=nurse_id,
            chief_complaint=chief_complaint,
            symptoms=json.dumps(symptoms) if symptoms else None,
            age=self.calculate_age_from_dob(patient.date_of_birth),
            gender=patient.gender,
            
            # Vital signs (if provided)
            temperature_celsius=vital_signs.get("temperature") if vital_signs else None,
            heart_rate_bpm=vital_signs.get("heart_rate") if vital_signs else None,
            blood_pressure_systolic=vital_signs.get("bp_systolic") if vital_signs else None,
            blood_pressure_diastolic=vital_signs.get("bp_diastolic") if vital_signs else None,
            oxygen_saturation=vital_signs.get("oxygen_saturation") if vital_signs else None,
            
            # AI classification results
            calculated_priority=priority,
            ai_confidence_score=confidence,
            keywords_identified=keywords_found,
            
            # Risk factors
            cardiac_risk=risk_factors.get("cardiac_risk"),
            respiratory_risk=risk_factors.get("respiratory_risk"),
            neurological_risk=risk_factors.get("neurological_risk"),
            geriatric_risk=risk_factors.get("geriatric_risk"),
            pediatric_risk=risk_factors.get("pediatric_risk"),
            obstetric_risk=risk_factors.get("obstetric_risk"),
            
            # Final priority (defaults to AI suggestion)
            final_priority=priority,
            source=TriageSource.AI_ASSISTED,
            
            # Department recommendation
            suggested_department=suggested_dept,
            suggested_speciality=suggested_dept,  # Same for now, can be refined
            
            # Additional metadata
            risk_factors=json.dumps(risk_factors) if risk_factors else None,
            allergies=patient.allergies,
            current_medications=patient.current_medications,
            medical_history=patient.medical_history,
            
            # Timing
            triage_started_at=datetime.utcnow(),
            triage_completed_at=datetime.utcnow(),
            review_completed_at=datetime.utcnow(),
        )
        
        db.add(triage_record)
        return triage_record
    
    def prioritize_queue_order(self, triage_record: TriageRecord, current_queue_position: int) -> float:
        """
        Calculate a queue priority score for sorting
        
        Higher scores = higher priority in queue
        Combines triage priority with time-based factors
        """
        base_scores = {
            PriorityLevel.P1: 100.0,
            PriorityLevel.P2: 50.0,
            PriorityLevel.P3: 10.0
        }
        
        base_score = base_scores.get(triage_record.final_priority, 10.0)
        
        # Adjust based on risk factors
        risk_adjustment = 0.0
        if triage_record.cardiac_risk and triage_record.cardiac_risk > 0.7:
            risk_adjustment += 20.0
        if triage_record.respiratory_risk and triage_record.respiratory_risk > 0.7:
            risk_adjustment += 15.0
        if triage_record.neurological_risk and triage_record.neurological_risk > 0.7:
            risk_adjustment += 15.0
        
        # Time factor (reduces score for patients already waiting)
        # This prevents starving lower priority patients
        current_time = datetime.utcnow()
        waiting_seconds = (current_time - triage_record.triage_started_at).total_seconds()
        waiting_minutes = waiting_seconds / 60
        
        # Add 0.5 points per minute waiting (caps at 30 points)
        time_adjustment = min(30.0, waiting_minutes * 0.5)
        
        # Special adjustments for vulnerable populations
        vulnerable_adjustment = 0.0
        if triage_record.age < 12:  # Pediatric
            vulnerable_adjustment += 10.0
        if triage_record.age >= 65:  # Geriatric
            vulnerable_adjustment += 5.0
        
        total_score = base_score + risk_adjustment + time_adjustment + vulnerable_adjustment
        
        return total_score


# Initialize the triage engine as a singleton
triage_engine = TriageEngine()