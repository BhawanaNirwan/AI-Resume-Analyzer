import os
import json
import re
import pymupdf

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai

load_dotenv()

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY is not set in the .env file.")

client = genai.Client(api_key=api_key)

MODEL_NAME = "gemini-3.6-flash"


def extract_text_from_pdf(pdf_path):
    document = pymupdf.open(pdf_path)

    text = ""

    for page in document:
        text += page.get_text()
        text += "\n"

    document.close()

    return text.strip()


def clean_json_response(text):
    text = text.strip()

    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

    return text.strip()


def analyze_resume(resume_text, job_description):

    prompt = f"""
You are an expert ATS resume analyzer, recruiter, and technical interviewer.

Analyze the candidate's resume against the provided job description.

Do not invent information.

Do not claim the candidate has a skill unless it appears in the resume.

Do not invent work experience, projects, certifications, education,
achievements, or skills.

Missing skills must be based on requirements in the job description.

ATS keywords should primarily come from the job description.

Interview questions should be relevant to both the resume and job description.

Calculate the resume score using:

Skills relevance: 40%
Experience relevance: 20%
Projects relevance: 15%
ATS keyword coverage: 15%
Education/certifications relevance: 10%

Return ONLY valid JSON.

Use exactly this structure:

{{
    "resume_score": 0,
    "job_match_percentage": 0,
    "matching_skills": [],
    "missing_skills": [],
    "ats_keywords": [],
    "improvements": [],
    "interview_questions": []
}}

Rules:

resume_score:
Integer between 0 and 100.

job_match_percentage:
Integer between 0 and 100.

matching_skills:
List of skills present in the resume that are relevant to the job.

missing_skills:
Important skills required by the job but not clearly present in the resume.

ats_keywords:
10 to 15 important ATS keywords from the job description.

improvements:
5 to 7 specific and actionable resume improvement suggestions.

interview_questions:
Generate 8 interview questions.
Mix technical, project-based, and behavioral questions.
Questions must be based on the candidate's resume and job description.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}
"""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt
    )

    result_text = clean_json_response(response.text)

    try:
        return json.loads(result_text)
    except json.JSONDecodeError:
        raise ValueError("Gemini returned invalid JSON.")


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "AI Resume Analyzer API is running"
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy"
    })


@app.route("/analyze", methods=["POST"])
def analyze():

    if "resume" not in request.files:
        return jsonify({
            "error": "Please upload a resume PDF."
        }), 400

    resume = request.files["resume"]

    job_description = request.form.get(
        "job_description",
        ""
    ).strip()

    if resume.filename == "":
        return jsonify({
            "error": "Please select a resume."
        }), 400

    if not resume.filename.lower().endswith(".pdf"):
        return jsonify({
            "error": "Only PDF files are supported."
        }), 400

    if not job_description:
        return jsonify({
            "error": "Please enter a job description."
        }), 400

    safe_filename = os.path.basename(resume.filename)

    file_path = os.path.join(
        UPLOAD_FOLDER,
        safe_filename
    )

    try:

        resume.save(file_path)

        resume_text = extract_text_from_pdf(file_path)

        if not resume_text:
            return jsonify({
                "error": "Could not extract text from this PDF."
            }), 400

        result = analyze_resume(
            resume_text,
            job_description
        )

        return jsonify(result)

    except Exception as error:

        print("ERROR:", error)

        return jsonify({
            "error": str(error)
        }), 500

    finally:

        if os.path.exists(file_path):
            os.remove(file_path)


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )