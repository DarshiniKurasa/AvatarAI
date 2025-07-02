import json
from typing import Dict, Any, Optional

class ResumePitchGenerator:
    def __init__(self, resume_data: Dict[str, Any]):
        """
        Initialize with resume data in JSON format
        """
        self.resume_data = resume_data
        self.extracted_data = self._extract_data()
    
    def _extract_data(self) -> Dict[str, Any]:
        """Extract and structure relevant data from resume JSON"""
        try:
            attributes = self.resume_data.get('data', {}).get('attributes', {})
            result = attributes.get('result', {})
            
            # Basic info
            name = result.get('candidate_name', '')
            email = result.get('candidate_email', '')
            
            # Education
            education = result.get('education_qualifications', [{}])[0] if result.get('education_qualifications') else {}
            
            # Work experience
            positions = result.get('positions', [])
            current_position = positions[0] if positions else {}
            
            # Skills (from current position)
            skills = current_position.get('skills', [])
            
            # Certifications
            certifications = result.get('candidate_courses_and_certifications', [])
            
            return {
                'name': name,
                'email': email,
                'education': {
                    'degree': education.get('degree_type', ''),
                    'major': education.get('specialization_subjects', ''),
                    'school': education.get('school_name', ''),
                    'year': education.get('end_date', '').split('-')[0] if education.get('end_date') else ''
                },
                'experience': {
                    'title': current_position.get('position_name', ''),
                    'company': current_position.get('company_name', ''),
                    'duration': self._calculate_experience_years(current_position),
                    'description': current_position.get('job_details', '')
                },
                'skills': list(set(skills[:10])),  # Get top 10 unique skills
                'certifications': certifications
            }
            
        except Exception as e:
            raise ValueError(f"Error processing resume data: {str(e)}")
    
    def _calculate_experience_years(self, position: Dict[str, Any]) -> int:
        """Calculate years of experience from start date to present"""
        from datetime import datetime
        
        start_date_str = position.get('start_date')
        if not start_date_str:
            return 0
            
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            years = (datetime.now() - start_date).days / 365.25
            return round(years, 1)
        except (ValueError, TypeError):
            return 0
    
    def generate_pitch(self) -> str:
        """Generate a 1-minute elevator pitch from the resume data"""
        data = self.extracted_data
        
        # Introduction
        pitch = f"Hi, I'm {data['name']}."
        
        # Education
        if data['education']['degree'] and data['education']['school']:
            pitch += f" I hold a {data['education']['degree']} in {data['education']['major']} "
            pitch += f"from {data['education']['school']}"
            if data['education']['year']:
                pitch += f", completed in {data['education']['year']}."
            else:
                pitch += "."
        
        # Experience
        if data['experience']['title'] and data['experience']['company']:
            pitch += f"\n\nI've worked as a {data['experience']['title']} at {data['experience']['company']}"
            if data['experience']['duration'] > 0:
                pitch += f" for {data['experience']['duration']} years"
            pitch += ", where I "
            
            # Add key responsibilities (first sentence of job description)
            first_sentence = data['experience']['description'].split('. ')[0]
            if first_sentence:
                pitch += first_sentence[0].lower() + first_sentence[1:]  # Lowercase first letter
                if not pitch.endswith('.'):
                    pitch += "."
        
        # Skills
        if data['skills']:
            pitch += "\n\nMy key skills include "
            pitch += ", ".join(data['skills'][:5])  # Top 5 skills
            pitch += ", and more."
        
        # Certifications
        if data['certifications']:
            pitch += f"\n\nI'm also {' and '.join(data['certifications'])} certified"
            if len(data['certifications']) == 1:
                pitch += "."
            else:
                pitch += "."
        
        # Closing
        pitch += "\n\nI'm now eager to contribute to a forward-thinking organization where I can apply my skills and expertise to make a meaningful impact."
        
        return pitch

def generate_pitch_from_json(json_file_path: str) -> str:
    """Helper function to generate pitch directly from JSON file"""
    try:
        with open(json_file_path, 'r') as f:
            resume_data = json.load(f)
        
        generator = ResumePitchGenerator(resume_data)
        return generator.generate_pitch()
    except Exception as e:
        return f"Error generating pitch: {str(e)}"

# Example usage
if __name__ == "__main__":
    # Example usage with the provided JSON
    example_json = {
        # ... (the example JSON from the user's input)
    }
    
    # Create generator with example data
    generator = ResumePitchGenerator(example_json)
    
    # Generate and print the pitch
    print(generator.generate_pitch())
