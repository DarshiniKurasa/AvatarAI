from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import json
import uvicorn
import os
import traceback
from resume_pitch_generator import ResumePitchGenerator
import re

# Initialize FastAPI app
app = FastAPI(
    title="Resume Pitch Generator API",
    description="API for generating elevator pitches from resume data",
    version="1.0.0"
)

# CORS middleware to allow requests from your React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080", "http://127.0.0.1:3000", "http://127.0.0.1:8080"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

class ResumeData(BaseModel):
    data: Dict[str, Any]

class ResumeText(BaseModel):
    text: str

class EducationQualification(BaseModel):
    degree_type: str = ""
    school_name: str = ""
    specialization_subjects: str = ""
    end_date: str = ""

class Position(BaseModel):
    position_name: str = ""
    company_name: str = ""
    start_date: str = ""
    job_details: str = ""
    skills: List[str] = []

@app.get("/")
async def root():
    """Root endpoint to verify service is running"""
    return {
        "message": "Resume Pitch Generator API is running",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Resume Pitch Generator",
        "port": 8000
    }

@app.post("/generate-pitch")
async def generate_pitch(resume_data: ResumeData):
    """
    Generate an elevator pitch from resume JSON data
    
    Request body should be a JSON object with the resume data
    """
    try:
        # Print the received data for debugging
        print("Received resume data:", json.dumps(resume_data.dict(), indent=2))
        
        # Initialize the generator with the data
        generator = ResumePitchGenerator(resume_data.data)
        pitch = generator.generate_pitch()
        
        return {
            "success": True,
            "pitch": pitch,
            "word_count": len(pitch.split()) if pitch else 0
        }
    except Exception as e:
        error_msg = f"Error generating pitch: {str(e)}"
        print(error_msg)
        print("Traceback:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/generate-pitch-from-text")
async def generate_pitch_from_text(resume_text: ResumeText):
    """
    Generate pitch from resume text content
    """
    try:
        print("Received resume text:", resume_text.text[:200] + "..." if len(resume_text.text) > 200 else resume_text.text)
        
        # If your ResumePitchGenerator expects text instead of structured data
        generator = ResumePitchGenerator({"text": resume_text.text})
        pitch = generator.generate_pitch()
        
        return {
            "success": True,
            "pitch": pitch,
            "word_count": len(pitch.split()) if pitch else 0
        }
    except Exception as e:
        error_msg = f"Error generating pitch from text: {str(e)}"
        print(error_msg)
        print("Traceback:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/generate-pitch-from-file")
async def generate_pitch_from_file(file: UploadFile = File(...)):
    """
    Generate pitch from a file upload
    """
    try:
        # Check file type
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file uploaded")
        
        # Read file content
        content = await file.read()
        
        # Try to parse as JSON first
        try:
            resume_data = json.loads(content.decode('utf-8'))
            generator = ResumePitchGenerator(resume_data)
        except json.JSONDecodeError:
            # If not JSON, treat as plain text
            text_content = content.decode('utf-8')
            generator = ResumePitchGenerator({"text": text_content})
        
        pitch = generator.generate_pitch()
        
        return {
            "success": True,
            "pitch": pitch,
            "word_count": len(pitch.split()) if pitch else 0,
            "filename": file.filename
        }
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Error processing file: {str(e)}"
        print(error_msg)
        print("Traceback:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_msg)

def extract_name_from_text(text: str) -> str:
    """Extract candidate name from resume text"""
    lines = text.strip().split('\n')
    for line in lines[:5]:  # Check first 5 lines
        line = line.strip()
        if line and not any(keyword in line.lower() for keyword in ['resume', 'cv', 'curriculum', 'email', 'phone', 'address', '@']):
            # Additional check to ensure it looks like a name (not too long, contains letters)
            if len(line) < 50 and re.search(r'[a-zA-Z]', line):
                return line
    return ""

def extract_email_from_text(text: str) -> str:
    """Extract email address from resume text"""
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    emails = re.findall(email_pattern, text)
    return emails[0] if emails else ""

def extract_education_from_text(text: str) -> List[Dict[str, str]]:
    """Extract education information from resume text"""
    education_section = ""
    lines = text.split('\n')
    
    for i, line in enumerate(lines):
        if re.search(r'\b(education|degree|university|college|school|academic)\b', line.lower()):
            education_section = line + "\n"
            j = i + 1
            # Continue reading until we hit another major section
            while j < len(lines) and lines[j].strip():
                next_line = lines[j].lower()
                if re.search(r'\b(experience|work|employment|skills|projects|certifications)\b', next_line):
                    break
                education_section += lines[j] + "\n"
                j += 1
            break
    
    # Extract degree information
    degree_pattern = r'\b(B\.?S\.?|M\.?S\.?|Ph\.?D\.?|Bachelor|Master|Doctor|B\.?A\.?|M\.?A\.?|MBA|B\.?Tech|M\.?Tech)\b'
    degree_match = re.search(degree_pattern, education_section, re.IGNORECASE)
    degree = degree_match.group(0) if degree_match else ""
    
    # Try to extract school/university name
    school_pattern = r'\b(University|College|Institute|School)\b[^,\n]*'
    school_match = re.search(school_pattern, education_section, re.IGNORECASE)
    school = school_match.group(0) if school_match else ""
    
    return [{
        "degree_type": degree,
        "school_name": school,
        "specialization_subjects": "",
        "end_date": ""
    }] if degree or school else []

def extract_experience_from_text(text: str) -> List[Dict[str, Any]]:
    """Extract work experience from resume text"""
    experience_section = ""
    lines = text.split('\n')
    
    for i, line in enumerate(lines):
        if re.search(r'\b(experience|work|employment|career|professional)\b', line.lower()):
            j = i + 1
            # Continue reading until we hit another major section
            while j < len(lines) and lines[j].strip():
                next_line = lines[j].lower()
                if re.search(r'\b(education|skills|projects|certifications)\b', next_line):
                    break
                experience_section += lines[j] + "\n"
                j += 1
            break
    
    # Simple extraction - in a real app, you'd want more sophisticated parsing
    positions = []
    if experience_section:
        # Try to identify job titles and companies
        job_pattern = r'([A-Za-z\s]+(?:Engineer|Developer|Manager|Analyst|Consultant|Specialist|Lead|Senior|Junior))'
        jobs = re.findall(job_pattern, experience_section)
        
        positions.append({
            "position_name": jobs[0] if jobs else "",
            "company_name": "",
            "start_date": "",
            "job_details": experience_section.strip(),
            "skills": []
        })
    
    return positions

def extract_skills_from_text(text: str) -> List[str]:
    """Extract skills from resume text"""
    skills_section = ""
    lines = text.split('\n')
    
    for i, line in enumerate(lines):
        if re.search(r'\b(skills|technologies|tools|technical|programming)\b', line.lower()):
            j = i + 1
            # Continue reading until we hit another major section
            while j < len(lines) and lines[j].strip():
                next_line = lines[j].lower()
                if re.search(r'\b(education|experience|projects|certifications)\b', next_line):
                    break
                skills_section += lines[j] + "\n"
                j += 1
            break
    
    # Extract individual skills
    skills = []
    if skills_section:
        # Split by common separators
        skills = re.split(r'[,;\n•·]', skills_section)
        skills = [skill.strip() for skill in skills if skill.strip() and len(skill.strip()) > 1]
        # Remove empty strings and overly long entries
        skills = [skill for skill in skills if 2 <= len(skill) <= 50]
    
    return skills

def extract_certifications_from_text(text: str) -> List[str]:
    """Extract certifications from resume text"""
    certifications_section = ""
    lines = text.split('\n')
    
    for i, line in enumerate(lines):
        if re.search(r'\b(certifications?|certificates?|courses?|training)\b', line.lower()):
            j = i + 1
            # Continue reading until we hit another major section
            while j < len(lines) and lines[j].strip():
                next_line = lines[j].lower()
                if re.search(r'\b(education|experience|projects|skills)\b', next_line):
                    break
                certifications_section += lines[j] + "\n"
                j += 1
            break
    
    # Extract individual certifications
    certifications = []
    if certifications_section:
        # Split by common separators
        certifications = re.split(r'[,;\n•·]', certifications_section)
        certifications = [cert.strip() for cert in certifications if cert.strip() and len(cert.strip()) > 1]
        # Remove empty strings and overly long entries
        certifications = [cert for cert in certifications if 2 <= len(cert) <= 100]
    
    return certifications

@app.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    """
    Parse resume file and return structured data
    This endpoint matches what your Node.js backend is calling
    """
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file uploaded")
        
        print(f"Received file: {file.filename}, Content-Type: {file.content_type}")
        
        # Read file content
        content = await file.read()
        
        # Handle different file types
        if file.filename.endswith('.json'):
            try:
                resume_data = json.loads(content.decode('utf-8'))
                return {
                    "success": True,
                    "data": resume_data,
                    "message": "Resume parsed successfully"
                }
            except json.JSONDecodeError as e:
                raise HTTPException(status_code=400, detail=f"Invalid JSON format: {str(e)}")
        
        elif file.filename.endswith('.txt'):
            # For text files, decode as text
            try:
                text_content = content.decode('utf-8')
            except UnicodeDecodeError:
                try:
                    text_content = content.decode('latin-1')
                except UnicodeDecodeError:
                    raise HTTPException(status_code=400, detail="Unable to decode text file")
            
            # Create a structured data format with the extracted information
            structured_data = {
                "data": {
                    "attributes": {
                        "result": {
                            "candidate_name": extract_name_from_text(text_content),
                            "candidate_email": extract_email_from_text(text_content),
                            "education_qualifications": extract_education_from_text(text_content),
                            "positions": extract_experience_from_text(text_content),
                            "skills": extract_skills_from_text(text_content),
                            "candidate_courses_and_certifications": extract_certifications_from_text(text_content)
                        }
                    }
                }
            }
            
            # Generate pitch from the structured data
            generator = ResumePitchGenerator(structured_data)
            pitch = generator.generate_pitch()
            
            return {
                "success": True,
                "data": structured_data,
                "pitch": pitch,
                "message": "Resume parsed successfully"
            }
        
        elif file.filename.endswith(('.doc', '.docx')):
            # For DOCX files, use python-docx library
            temp_file_path = f"temp_{file.filename}"
            try:
                with open(temp_file_path, "wb") as f:
                    f.write(content)
                
                # Import docx here to handle import errors gracefully
                try:
                    from docx import Document
                except ImportError:
                    raise HTTPException(
                        status_code=500, 
                        detail="python-docx library is required to parse DOCX files. Please install it with: pip install python-docx"
                    )
                
                doc = Document(temp_file_path)
                text_content = "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
                
                # Create a structured data format with the extracted information
                structured_data = {
                    "data": {
                        "attributes": {
                            "result": {
                                "candidate_name": extract_name_from_text(text_content),
                                "candidate_email": extract_email_from_text(text_content),
                                "education_qualifications": extract_education_from_text(text_content),
                                "positions": extract_experience_from_text(text_content),
                                "skills": extract_skills_from_text(text_content),
                                "candidate_courses_and_certifications": extract_certifications_from_text(text_content)
                            }
                        }
                    }
                }
                
                # Generate pitch from the structured data
                generator = ResumePitchGenerator(structured_data)
                pitch = generator.generate_pitch()
                
                return {
                    "success": True,
                    "data": structured_data,
                    "pitch": pitch,
                    "message": "Resume parsed successfully"
                }
            
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error processing DOCX file: {str(e)}")
            finally:
                # Clean up the temp file
                try:
                    if os.path.exists(temp_file_path):
                        os.remove(temp_file_path)
                except:
                    pass  # Ignore cleanup errors
        
        elif file.filename.endswith('.pdf'):
            # For PDF files, you need to use a library like PyPDF2 or pdfplumber
            try:
                import PyPDF2
            except ImportError:
                raise HTTPException(
                    status_code=500, 
                    detail="PyPDF2 library is required to parse PDF files. Please install it with: pip install PyPDF2"
                )
            
            # Basic PDF text extraction
            temp_file_path = f"temp_{file.filename}"
            try:
                with open(temp_file_path, "wb") as f:
                    f.write(content)
                
                with open(temp_file_path, "rb") as pdf_file:
                    pdf_reader = PyPDF2.PdfReader(pdf_file)
                    text_content = ""
                    for page in pdf_reader.pages:
                        text_content += page.extract_text() + "\n"
                
                # Create structured data from extracted text
                structured_data = {
                    "data": {
                        "attributes": {
                            "result": {
                                "candidate_name": extract_name_from_text(text_content),
                                "candidate_email": extract_email_from_text(text_content),
                                "education_qualifications": extract_education_from_text(text_content),
                                "positions": extract_experience_from_text(text_content),
                                "skills": extract_skills_from_text(text_content),
                                "candidate_courses_and_certifications": extract_certifications_from_text(text_content)
                            }
                        }
                    }
                }
                
                # Generate pitch from the structured data
                generator = ResumePitchGenerator(structured_data)
                pitch = generator.generate_pitch()
                
                return {
                    "success": True,
                    "data": structured_data,
                    "pitch": pitch,
                    "message": "Resume parsed successfully"
                }
            
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error processing PDF file: {str(e)}")
            finally:
                # Clean up the temp file
                try:
                    if os.path.exists(temp_file_path):
                        os.remove(temp_file_path)
                except:
                    pass  # Ignore cleanup errors
        
        else:
            raise HTTPException(
                status_code=400, 
                detail="Unsupported file format. Please upload JSON, TXT, PDF, DOC, or DOCX files."
            )
    
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Error parsing resume: {str(e)}"
        print(error_msg)
        print("Traceback:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_msg)

# Error handler for debugging
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Global exception handler caught: {str(exc)}")
    print("Traceback:", traceback.format_exc())
    return {
        "error": "Internal server error",
        "detail": str(exc),
        "path": str(request.url)
    }

# Only run uvicorn if this file is executed directly
if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )