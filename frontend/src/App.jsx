import { useState } from "react";
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  MessageSquare,
  Target,
  RotateCcw
} from "lucide-react";

function App() {
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF resume.");
      return;
    }

    setResume(file);
    setError("");
    setResult(null);
  };

  const analyzeResume = async () => {
    if (!resume) {
      setError("Please upload your resume.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please enter a job description.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();

    formData.append("resume", resume);
    formData.append("job_description", jobDescription);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/analyze",
        {
          method: "POST",
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Analysis failed."
        );
      }

      setResult(data);

    } catch (err) {
      setError(
        err.message ||
        "Unable to connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setResume(null);
    setJobDescription("");
    setResult(null);
    setError("");
  };

  return (
    <div className="app">

      <header className="hero">

        <div className="logo">
          <Sparkles size={24} />
          <span>ResumeAI</span>
        </div>

        <div className="hero-content">

          <div className="badge">
            <Sparkles size={16} />
            Powered by Gemini AI
          </div>

          <h1>
            AI Resume Analyzer
            <span> & Job Matcher</span>
          </h1>

          <p>
            Upload your resume and compare it with any job
            description to get AI-powered career insights.
          </p>

        </div>

      </header>

      <main className="container">

        {!result && (

          <section className="analyzer-card">

            <div className="section-header">

              <div>
                <h2>Analyze Your Resume</h2>

                <p>
                  Upload your resume and paste the job
                  description below.
                </p>
              </div>

            </div>

            <div className="upload-section">

              <label className="upload-box">

                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  hidden
                />

                <Upload size={40} />

                <h3>
                  {resume
                    ? resume.name
                    : "Upload your resume"}
                </h3>

                <p>
                  {resume
                    ? "PDF selected"
                    : "Click to browse PDF files"}
                </p>

              </label>

            </div>

            <div className="job-section">

              <label>
                Job Description
              </label>

              <textarea
                value={jobDescription}
                onChange={(e) =>
                  setJobDescription(e.target.value)
                }
                placeholder="Paste the complete job description here..."
                rows="10"
              />

              <div className="character-count">
                {jobDescription.length} characters
              </div>

            </div>

            {error && (

              <div className="error-box">

                <AlertCircle size={20} />

                <span>{error}</span>

              </div>

            )}

            <button
              className="analyze-button"
              onClick={analyzeResume}
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing Resume...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Analyze Resume
                </>
              )}

            </button>

            {loading && (

              <div className="loading-box">

                <div>
                  <FileText size={18} />
                  Extracting resume information
                </div>

                <div>
                  <Target size={18} />
                  Comparing job requirements
                </div>

                <div>
                  <Sparkles size={18} />
                  Generating AI insights
                </div>

              </div>

            )}

          </section>

        )}

        {result && (

          <Results
            result={result}
            resetAnalysis={resetAnalysis}
          />

        )}

      </main>

      <footer>
        <p>
          AI Resume Analyzer • Built with React,
          Flask & Gemini
        </p>
      </footer>

    </div>
  );
}


function Results({ result, resetAnalysis }) {

  return (

    <section className="results">

      <div className="results-header">

        <div>

          <div className="badge">
            <Sparkles size={16} />
            AI Analysis Complete
          </div>

          <h2>
            Your Resume Analysis
          </h2>

          <p>
            Here's how your resume matches the job
            description.
          </p>

        </div>

        <button
          className="reset-button"
          onClick={resetAnalysis}
        >
          <RotateCcw size={18} />
          Analyze Another
        </button>

      </div>


      <div className="score-grid">

        <div className="score-card">

          <div className="score-icon">
            <FileText />
          </div>

          <span>Resume Score</span>

          <strong>
            {result.resume_score}
            <small>/100</small>
          </strong>

        </div>


        <div className="score-card">

          <div className="score-icon">
            <Target />
          </div>

          <span>Job Match</span>

          <strong>
            {result.job_match_percentage}
            <small>%</small>
          </strong>

        </div>

      </div>


      <div className="result-grid">

        <div className="result-card">

          <div className="card-title">

            <CheckCircle />

            <h3>Matching Skills</h3>

          </div>

          <div className="skill-list">

            {result.matching_skills?.map(
              (skill, index) => (

                <span
                  className="skill matching"
                  key={index}
                >
                  <CheckCircle size={15} />
                  {skill}
                </span>

              )
            )}

          </div>

        </div>


        <div className="result-card">

          <div className="card-title">

            <AlertCircle />

            <h3>Missing Skills</h3>

          </div>

          <div className="skill-list">

            {result.missing_skills?.map(
              (skill, index) => (

                <span
                  className="skill missing"
                  key={index}
                >
                  <AlertCircle size={15} />
                  {skill}
                </span>

              )
            )}

          </div>

        </div>

      </div>


      <div className="result-card">

        <div className="card-title">

          <Target />

          <h3>ATS-Friendly Keywords</h3>

        </div>

        <div className="keyword-list">

          {result.ats_keywords?.map(
            (keyword, index) => (

              <span
                className="keyword"
                key={index}
              >
                {keyword}
              </span>

            )
          )}

        </div>

      </div>


      <div className="result-card">

        <div className="card-title">

          <Lightbulb />

          <h3>Suggested Improvements</h3>

        </div>

        <div className="improvement-list">

          {result.improvements?.map(
            (item, index) => (

              <div
                className="improvement"
                key={index}
              >

                <span>
                  {index + 1}
                </span>

                <p>{item}</p>

              </div>

            )
          )}

        </div>

      </div>


      <div className="result-card">

        <div className="card-title">

          <MessageSquare />

          <h3>Interview Questions</h3>

        </div>

        <div className="question-list">

          {result.interview_questions?.map(
            (question, index) => (

              <div
                className="question"
                key={index}
              >

                <span>
                  {String(index + 1).padStart(2, "0")}
                </span>

                <p>{question}</p>

              </div>

            )
          )}

        </div>

      </div>

    </section>

  );
}

export default App;