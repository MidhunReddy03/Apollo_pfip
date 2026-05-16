"""
Workflow Optimization Engine
Handles test sequencing, dependency resolution, and time optimization
"""
from typing import List, Dict, Set, Tuple, Optional
from datetime import datetime, timedelta
import json


class TestNode:
    """Represents a test in the workflow graph"""
    def __init__(self, test_code: str, test_name: str, duration: int, 
                 department: str, requires_fasting: bool = False,
                 dependencies: List[str] = None, can_parallel_with: List[str] = None):
        self.test_code = test_code
        self.test_name = test_name
        self.duration = duration
        self.department = department
        self.requires_fasting = requires_fasting
        self.dependencies = dependencies or []
        self.can_parallel_with = can_parallel_with or []
        self.scheduled_start: Optional[datetime] = None
        self.scheduled_end: Optional[datetime] = None
        self.station_id: Optional[int] = None


class WorkflowOptimizer:
    """
    Optimizes patient workflow by:
    1. Resolving test dependencies
    2. Identifying parallel execution opportunities
    3. Minimizing total turnaround time
    4. Considering equipment availability
    """
    
    def __init__(self):
        self.test_catalog: Dict[str, TestNode] = {}
        
    def add_test_definition(self, test: TestNode):
        """Add a test to the catalog"""
        self.test_catalog[test.test_code] = test
    
    def topological_sort(self, test_codes: List[str]) -> List[List[str]]:
        """
        Perform topological sort to determine test execution order
        Returns list of levels where tests in same level can run in parallel
        """
        # Build dependency graph
        graph = {code: set(self.test_catalog[code].dependencies) 
                for code in test_codes if code in self.test_catalog}
        
        # Calculate in-degree for each node
        in_degree = {code: 0 for code in test_codes}
        for code in test_codes:
            if code in self.test_catalog:
                for dep in self.test_catalog[code].dependencies:
                    if dep in in_degree:
                        in_degree[dep] += 1
        
        # Process nodes level by level
        levels = []
        remaining = set(test_codes)
        
        while remaining:
            # Find all nodes with in-degree 0
            current_level = [code for code in remaining if in_degree[code] == 0]
            
            if not current_level:
                # Circular dependency detected
                raise ValueError("Circular dependency detected in test workflow")
            
            levels.append(current_level)
            
            # Remove current level nodes and update in-degrees
            for code in current_level:
                remaining.remove(code)
                if code in self.test_catalog:
                    for dependent in test_codes:
                        if dependent in remaining and code in self.test_catalog[dependent].dependencies:
                            in_degree[dependent] -= 1
        
        return levels
    
    def identify_parallel_tests(self, test_codes: List[str]) -> List[Set[str]]:
        """
        Identify tests that can be executed in parallel
        Returns list of sets where each set contains tests that can run together
        """
        parallel_groups = []
        
        for code in test_codes:
            if code not in self.test_catalog:
                continue
                
            test = self.test_catalog[code]
            
            # Find tests that can run in parallel with this one
            parallel_set = {code}
            for other_code in test.can_parallel_with:
                if other_code in test_codes:
                    parallel_set.add(other_code)
            
            # Check if this group already exists
            if parallel_set not in parallel_groups:
                parallel_groups.append(parallel_set)
        
        return parallel_groups
    
    def optimize_sequence(self, test_codes: List[str], 
                         station_availability: Dict[str, List[int]] = None) -> Dict:
        """
        Optimize test sequence for minimum turnaround time
        
        Args:
            test_codes: List of test codes to schedule
            station_availability: Dict mapping department to available station IDs
            
        Returns:
            Optimized workflow with sequence, timing, and station assignments
        """
        if not test_codes:
            return {
                "sequence": [],
                "total_time": 0,
                "parallel_opportunities": 0,
                "optimization_score": 100
            }
        
        # Step 1: Resolve dependencies using topological sort
        try:
            dependency_levels = self.topological_sort(test_codes)
        except ValueError as e:
            return {"error": str(e)}
        
        # Step 2: Identify parallel execution opportunities
        parallel_groups = self.identify_parallel_tests(test_codes)
        
        # Step 3: Build optimized sequence
        sequence = []
        current_time = datetime.now()
        step_number = 1
        
        for level in dependency_levels:
            # Group tests in this level by department for efficiency
            dept_groups = {}
            for code in level:
                if code in self.test_catalog:
                    test = self.test_catalog[code]
                    if test.department not in dept_groups:
                        dept_groups[test.department] = []
                    dept_groups[test.department].append(code)
            
            # Schedule tests in this level
            level_start_time = current_time
            level_max_duration = 0
            
            for dept, codes in dept_groups.items():
                for code in codes:
                    test = self.test_catalog[code]
                    
                    # Assign station if availability provided
                    station_id = None
                    if station_availability and dept in station_availability:
                        if station_availability[dept]:
                            station_id = station_availability[dept][0]
                    
                    # Check if this test can run in parallel with others
                    can_parallel = any(code in group and len(group) > 1 
                                     for group in parallel_groups)
                    
                    sequence.append({
                        "step": step_number,
                        "test_code": code,
                        "test_name": test.test_name,
                        "department": test.department,
                        "duration": test.duration,
                        "start_time": level_start_time.isoformat(),
                        "end_time": (level_start_time + timedelta(minutes=test.duration)).isoformat(),
                        "station_id": station_id,
                        "can_parallel": can_parallel,
                        "dependencies": test.dependencies,
                        "requires_fasting": test.requires_fasting
                    })
                    
                    level_max_duration = max(level_max_duration, test.duration)
                    step_number += 1
            
            # Move to next level (after longest test in current level completes)
            current_time = level_start_time + timedelta(minutes=level_max_duration)
        
        # Step 4: Calculate metrics
        total_time = sum(step["duration"] for step in sequence)
        actual_time = (current_time - datetime.now()).total_seconds() / 60
        
        # Optimization score: how much time saved vs sequential execution
        optimization_score = ((total_time - actual_time) / total_time * 100) if total_time > 0 else 100
        
        # Step 5: Identify fasting requirements
        fasting_tests = [step for step in sequence if step["requires_fasting"]]
        if fasting_tests:
            # Move fasting tests to the beginning
            sequence = sorted(sequence, key=lambda x: (not x["requires_fasting"], x["step"]))
            # Renumber steps
            for i, step in enumerate(sequence, 1):
                step["step"] = i
        
        return {
            "sequence": sequence,
            "total_sequential_time": int(total_time),
            "optimized_time": int(actual_time),
            "time_saved": int(total_time - actual_time),
            "parallel_opportunities": len(parallel_groups),
            "optimization_score": round(optimization_score, 2),
            "dependency_levels": len(dependency_levels),
            "fasting_required": len(fasting_tests) > 0
        }
    
    def estimate_wait_time(self, test_code: str, current_queue_length: int,
                          avg_service_time: int) -> int:
        """
        Estimate wait time for a test based on current queue
        
        Args:
            test_code: Test to estimate wait time for
            current_queue_length: Number of patients in queue
            avg_service_time: Average time per patient
            
        Returns:
            Estimated wait time in minutes
        """
        if test_code not in self.test_catalog:
            return 0
        
        test = self.test_catalog[test_code]
        
        # Base wait time from queue
        base_wait = current_queue_length * avg_service_time
        
        # Add buffer for high-priority tests
        buffer = 5  # 5 minutes buffer
        
        return base_wait + buffer
    
    def detect_bottlenecks(self, station_stats: List[Dict]) -> List[Dict]:
        """
        Detect bottlenecks in the workflow
        
        Args:
            station_stats: List of station statistics with queue length and utilization
            
        Returns:
            List of detected bottlenecks with recommendations
        """
        bottlenecks = []
        
        for station in station_stats:
            issues = []
            
            # High queue length
            if station.get("queue_length", 0) > 5:
                issues.append("High queue length")
            
            # High utilization
            if station.get("utilization", 0) > 85:
                issues.append("High utilization")
            
            # Long wait times
            if station.get("avg_wait_time", 0) > 20:
                issues.append("Long wait times")
            
            if issues:
                bottlenecks.append({
                    "station_id": station.get("id"),
                    "station_name": station.get("name"),
                    "department": station.get("department"),
                    "issues": issues,
                    "severity": "high" if len(issues) >= 2 else "medium",
                    "recommendations": self._generate_recommendations(station, issues)
                })
        
        return bottlenecks
    
    def _generate_recommendations(self, station: Dict, issues: List[str]) -> List[str]:
        """Generate recommendations for bottleneck resolution"""
        recommendations = []
        
        if "High queue length" in issues:
            recommendations.append("Consider opening additional station")
            recommendations.append("Reroute non-urgent patients to alternate stations")
        
        if "High utilization" in issues:
            recommendations.append("Schedule maintenance during off-peak hours")
            recommendations.append("Add staff to increase throughput")
        
        if "Long wait times" in issues:
            recommendations.append("Implement express lane for quick tests")
            recommendations.append("Send proactive delay notifications to patients")
        
        return recommendations


# Example usage and test data
def create_sample_workflow():
    """Create sample workflow optimizer with test definitions"""
    optimizer = WorkflowOptimizer()
    
    # Add sample test definitions
    tests = [
        TestNode("XRAY_CHEST", "Chest X-Ray", 15, "Radiology", False, [], ["ECG"]),
        TestNode("ECG", "Electrocardiogram", 10, "Cardiology", False, [], ["XRAY_CHEST"]),
        TestNode("BLOOD_CBC", "Complete Blood Count", 5, "Laboratory", True, [], ["BLOOD_LIPID"]),
        TestNode("BLOOD_LIPID", "Lipid Profile", 5, "Laboratory", True, ["BLOOD_CBC"], ["BLOOD_CBC"]),
        TestNode("ULTRASOUND", "Abdominal Ultrasound", 20, "Radiology", False, ["BLOOD_CBC"], []),
        TestNode("CT_SCAN", "CT Scan", 30, "Radiology", False, ["XRAY_CHEST"], []),
        TestNode("MRI", "MRI Scan", 45, "Radiology", False, ["CT_SCAN"], []),
    ]
    
    for test in tests:
        optimizer.add_test_definition(test)
    
    return optimizer


if __name__ == "__main__":
    # Test the optimizer
    optimizer = create_sample_workflow()
    
    # Optimize a sample workflow
    test_codes = ["XRAY_CHEST", "ECG", "BLOOD_CBC", "BLOOD_LIPID", "ULTRASOUND"]
    result = optimizer.optimize_sequence(test_codes)
    
    print("Workflow Optimization Result:")
    print(json.dumps(result, indent=2))
