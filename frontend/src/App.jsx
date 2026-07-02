import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Sparkles, Copy, Check, Download, FileText, 
  Clock, Tag, BarChart3, Moon, Sun, 
  History, Trash2, ExternalLink, Loader2,
  FileUp, Link, X, User, Award, Target,
  ThumbsUp, AlertCircle, Lightbulb, TrendingUp,
  GraduationCap, MapPin, Wrench, Languages, Briefcase,
  ChevronDown, ChevronUp, Zap, ShieldCheck
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [description, setDescription] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profile, setProfile] = useState({
    education_level: '',
    country: '',
    skills: '',
    english_proficiency: '',
    years_experience: '',
    field_of_study: '',
    additional_info: ''
  });
  const [matchResult, setMatchResult] = useState(null);
  const [analyzingMatch, setAnalyzingMatch] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('analysisHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load history');
      }
    }
    
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error('Failed to load profile');
      }
    }
    
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (profile.education_level || profile.country) {
      localStorage.setItem('userProfile', JSON.stringify(profile));
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('analysisHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleAnalyze = async (withMatch = false) => {
    if (!description.trim() || description.length < 10) {
      setError('Please enter at least 10 characters');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setMatchResult(null);

    try {
      let response;
      if (withMatch) {
        if (!profile.education_level || !profile.country) {
          setError('Please fill in your profile details first');
          setLoading(false);
          return;
        }
        
        const skillsList = profile.skills.split(',').map(s => s.trim()).filter(s => s);
        
        response = await axios.post(`${API_URL}/api/analyze-with-match`, {
          description: description.trim(),
          user_profile: {
            ...profile,
            skills: skillsList,
            years_experience: parseInt(profile.years_experience) || 0
          }
        });
      } else {
        response = await axios.post(`${API_URL}/api/analyze`, {
          description: description.trim()
        });
      }

      if (response.data.error) {
        setError(response.data.error);
      } else {
        setResult(response.data);
        if (response.data.match_result) {
          setMatchResult(response.data.match_result);
        }
        
        const historyEntry = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          description: description.trim().slice(0, 100) + '...',
          result: response.data
        };
        setHistory(prev => [historyEntry, ...prev].slice(0, 20));
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to analyze');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    let text = `
Title: ${result.title}
Summary: ${result.summary}
Category: ${result.category}
Tags: ${result.tags.join(', ')}
Reading Time: ${result.reading_time}
Confidence: ${result.confidence}%
    `.trim();
    
    if (matchResult) {
      text += `

MATCH ANALYSIS
Match Score: ${matchResult.match_score}%
Eligible: ${matchResult.eligible ? '✅ Yes' : '❌ No'}
Strengths: ${matchResult.strengths.join(', ')}
Missing Requirements: ${matchResult.missing_requirements.join(', ')}
Recommendations: ${matchResult.recommendations.join(', ')}
      `;
    }
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    if (!result) return;
    
    let matchHTML = '';
    if (matchResult) {
      matchHTML = `
        <h2>Profile Match Analysis</h2>
        <p><strong>Match Score:</strong> ${matchResult.match_score}%</p>
        <p><strong>Eligible:</strong> ${matchResult.eligible ? '✅ Yes' : '❌ No'}</p>
        <h3>Your Strengths</h3>
        <ul>${matchResult.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
        <h3>Missing Requirements</h3>
        <ul>${matchResult.missing_requirements.map(s => `<li>${s}</li>`).join('')}</ul>
        <h3>Recommendations</h3>
        <ul>${matchResult.recommendations.map(s => `<li>${s}</li>`).join('')}</ul>
      `;
    }
    
    const printContent = `
      <html>
        <head><title>Opportunity Analysis Report</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px;">
          <h1>Opportunity Analysis Report</h1>
          <hr>
          <h2>${result.title}</h2>
          <p><strong>Category:</strong> ${result.category}</p>
          <p><strong>Summary:</strong> ${result.summary}</p>
          <p><strong>Tags:</strong> ${result.tags.join(', ')}</p>
          <p><strong>Reading Time:</strong> ${result.reading_time}</p>
          <p><strong>Confidence Score:</strong> ${result.confidence}%</p>
          ${matchHTML}
          <hr>
          <p style="color: #666; font-size: 12px;">Generated by AI Opportunity Assistant</p>
        </body>
      </html>
    `;
    
    const win = window.open('', '_blank');
    win.document.write(printContent);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const handleFetchUrl = async () => {
    if (!urlInput.trim()) return;
    
    setFetchingUrl(true);
    try {
      const response = await axios.post(`${API_URL}/api/fetch-url`, {
        url: urlInput.trim()
      });
      
      if (response.data.success && response.data.content) {
        setDescription(response.data.content);
        setShowUrlInput(false);
        setUrlInput('');
      } else {
        setError('Failed to fetch content from URL');
      }
    } catch (err) {
      setError('Error fetching URL content');
    } finally {
      setFetchingUrl(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all history?')) {
      setHistory([]);
    }
  };

  const loadFromHistory = (entry) => {
    setDescription(entry.description);
    setResult(entry.result);
    setMatchResult(entry.result.match_result || null);
    setShowHistory(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDescription(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleProfileChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600 dark:text-green-400';
    if (confidence >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceBg = (confidence) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getMatchScoreBg = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAnalyze(false);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [description]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-slate-950' : 'bg-[#f4f8f1]'}`}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-700 to-lime-500 shadow-lg shadow-emerald-900/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-emerald-950'}`}>
              AI Opportunity Assistant
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-emerald-100 text-emerald-800'
              }`}
              title="History"
            >
              <History className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-emerald-100 text-emerald-800'
              }`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {showHistory && (
          <div className={`mb-4 p-4 rounded-lg border ${
            darkMode ? 'bg-slate-900 border-slate-700' : 'bg-emerald-50 border-emerald-100'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-emerald-950'}`}>
                Analysis History
              </h3>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Clear
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No history yet
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {history.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => loadFromHistory(entry)}
                    className={`w-full text-left p-2 rounded text-sm transition-colors ${
                      darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-white text-emerald-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate flex-1">{entry.result.title || 'Untitled'}</span>
                      <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-emerald-900/45'}`}>
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={`rounded-lg shadow-lg p-6 mb-6 ${
          darkMode ? 'bg-slate-900' : 'bg-white'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <FileText className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-emerald-950'}`}>
              Opportunity Description
            </span>
            <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-emerald-900/45'}`}>
              ({description.length} characters)
            </span>
          </div>

          <textarea
            ref={textareaRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste the opportunity description here (minimum 10 characters)..."
            className={`w-full h-40 p-4 rounded-lg border resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              darkMode 
                ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500' 
                : 'bg-emerald-50 border-emerald-100 text-emerald-950 placeholder-emerald-900/35'
            }`}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleAnalyze(false)}
                disabled={loading || description.length < 10}
                className="px-4 py-2 bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-500 hover:from-emerald-800 hover:to-lime-600 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setShowProfileForm(!showProfileForm);
                  if (!showProfileForm) {
                    setShowUrlInput(false);
                  }
                }}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  darkMode 
                    ? 'hover:bg-slate-800 text-slate-300' 
                    : 'hover:bg-emerald-100 text-emerald-800'
                }`}
              >
                <User className="w-4 h-4" />
                {showProfileForm ? 'Hide Profile' : 'Add Profile'}
              </button>

              <button
                onClick={() => {
                  if (showProfileForm) {
                    handleAnalyze(true);
                  } else {
                    setShowProfileForm(true);
                  }
                }}
                disabled={loading || description.length < 10}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  darkMode 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950' 
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    Match Me!
                  </>
                )}
              </button>

              <button
                onClick={() => setShowUrlInput(!showUrlInput)}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  darkMode 
                    ? 'hover:bg-slate-800 text-slate-300' 
                    : 'hover:bg-emerald-100 text-emerald-800'
                }`}
                title="Fetch from URL"
              >
                <Link className="w-4 h-4" />
              </button>

              <label className={`px-3 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${
                darkMode 
                  ? 'hover:bg-slate-800 text-slate-300' 
                  : 'hover:bg-emerald-100 text-emerald-800'
              }`}>
                <FileUp className="w-4 h-4" />
                <input
                  type="file"
                  accept=".txt,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {description.length < 10 ? (
                <span className="text-red-500">Minimum 10 characters</span>
              ) : (
                `${description.split(/\s+/).filter(w => w).length} words`
              )}
            </div>
          </div>

          {showProfileForm && (
            <div className={`mt-4 p-4 rounded-lg border ${
              darkMode ? 'border-slate-700 bg-slate-950/60' : 'border-emerald-100 bg-emerald-50/80'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <User className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-emerald-950'}`}>
                  Your Profile
                </h3>
                <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-emerald-900/50'}`}>
                  (Used for match analysis)
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-emerald-900'}`}>
                    <GraduationCap className="w-4 h-4 inline mr-1" />
                    Education Level
                  </label>
                  <select
                    name="education_level"
                    value={profile.education_level}
                    onChange={handleProfileChange}
                    className={`w-full p-2 rounded border ${
                      darkMode 
                        ? 'bg-slate-900 border-slate-700 text-white' 
                        : 'bg-white border-emerald-100 text-emerald-950'
                    }`}
                  >
                    <option value="">Select...</option>
                    <option value="High School">High School</option>
                    <option value="Bachelor's">Bachelor's</option>
                    <option value="Master's">Master's</option>
                    <option value="PhD">PhD</option>
                    <option value="Postdoc">Postdoc</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-emerald-900'}`}>
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={profile.country}
                    onChange={handleProfileChange}
                    placeholder="e.g., Germany, USA, India"
                    className={`w-full p-2 rounded border ${
                      darkMode 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-white border-emerald-100 text-emerald-950 placeholder-emerald-900/35'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-emerald-900'}`}>
                    <Wrench className="w-4 h-4 inline mr-1" />
                    Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="skills"
                    value={profile.skills}
                    onChange={handleProfileChange}
                    placeholder="e.g., Python, JavaScript, Project Management"
                    className={`w-full p-2 rounded border ${
                      darkMode 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-white border-emerald-100 text-emerald-950 placeholder-emerald-900/35'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-emerald-900'}`}>
                    <Languages className="w-4 h-4 inline mr-1" />
                    English Proficiency
                  </label>
                  <select
                    name="english_proficiency"
                    value={profile.english_proficiency}
                    onChange={handleProfileChange}
                    className={`w-full p-2 rounded border ${
                      darkMode 
                        ? 'bg-slate-900 border-slate-700 text-white' 
                        : 'bg-white border-emerald-100 text-emerald-950'
                    }`}
                  >
                    <option value="">Select...</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Fluent">Fluent</option>
                    <option value="Native">Native</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-emerald-900'}`}>
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    name="years_experience"
                    value={profile.years_experience}
                    onChange={handleProfileChange}
                    placeholder="0"
                    min="0"
                    className={`w-full p-2 rounded border ${
                      darkMode 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-white border-emerald-100 text-emerald-950 placeholder-emerald-900/35'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-emerald-900'}`}>
                    <Award className="w-4 h-4 inline mr-1" />
                    Field of Study
                  </label>
                  <input
                    type="text"
                    name="field_of_study"
                    value={profile.field_of_study}
                    onChange={handleProfileChange}
                    placeholder="e.g., Computer Science, Engineering"
                    className={`w-full p-2 rounded border ${
                      darkMode 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-white border-emerald-100 text-emerald-950 placeholder-emerald-900/35'
                    }`}
                  />
                </div>
              </div>

              <div className="mt-2">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-emerald-900'}`}>
                  Additional Information
                </label>
                <textarea
                  name="additional_info"
                  value={profile.additional_info}
                  onChange={handleProfileChange}
                  placeholder="e.g., Publications, certifications, awards, relevant experience..."
                  rows="2"
                  className={`w-full p-2 rounded border ${
                    darkMode 
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                      : 'bg-white border-emerald-100 text-emerald-950 placeholder-emerald-900/35'
                  }`}
                />
              </div>

                <div className="mt-3 text-xs text-emerald-900/55 dark:text-slate-400">
                💡 Fill in your profile to get personalized match analysis with opportunities
              </div>
            </div>
          )}

          {showUrlInput && (
            <div className={`mt-3 p-3 rounded-lg border ${
              darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/opportunity"
                  className={`flex-1 p-2 rounded border ${
                    darkMode 
                      ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <button
                  onClick={handleFetchUrl}
                  disabled={fetchingUrl || !urlInput.trim()}
                  className="px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg transition-colors"
                >
                  {fetchingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch'}
                </button>
                <button
                  onClick={() => {
                    setShowUrlInput(false);
                    setUrlInput('');
                  }}
                  className={`p-2 rounded-lg ${
                    darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {result && (
          <div className={`rounded-lg shadow-lg p-6 ${
            darkMode ? 'bg-slate-900' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-emerald-950'}`}>
                Analysis Results
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors ${
                    darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleExportPDF}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors ${
                    darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-emerald-100 text-emerald-800'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-emerald-950'}`}>
                  {result.title}
                </h3>
              </div>

              <div>
                <p className={`${darkMode ? 'text-slate-300' : 'text-emerald-900/75'}`}>
                  {result.summary}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {result.category}
                </span>
                {result.tags.map((tag, index) => (
                  <span key={index} className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                    darkMode ? 'bg-slate-800 text-slate-300' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-4 border-t dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-emerald-600'}`} />
                  <span className={`${darkMode ? 'text-slate-300' : 'text-emerald-900/75'}`}>
                    {result.reading_time}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <BarChart3 className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-emerald-600'}`} />
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-emerald-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${getConfidenceBg(result.confidence)}`}
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                    <span className={`font-medium ${getConfidenceColor(result.confidence)}`}>
                      {result.confidence}% confidence
                    </span>
                  </div>
                </div>
              </div>

              {matchResult && (
                <div className={`mt-6 p-4 rounded-lg border-2 ${
                  matchResult.eligible 
                    ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20' 
                    : 'border-yellow-500 dark:border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`w-6 h-6 ${
                        matchResult.eligible ? 'text-green-500' : 'text-yellow-500'
                      }`} />
                      <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Profile Match Analysis
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-bold ${getMatchScoreColor(matchResult.match_score)}`}>
                        {matchResult.match_score}%
                      </span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        matchResult.eligible 
                          ? 'bg-green-500 text-white' 
                          : 'bg-yellow-500 text-white'
                      }`}>
                        {matchResult.eligible ? '✅ Eligible' : '⚠️ Review Required'}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${getMatchScoreBg(matchResult.match_score)}`}
                      style={{ width: `${matchResult.match_score}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <ThumbsUp className="w-4 h-4 text-green-500" />
                        <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Your Strengths
                        </h4>
                      </div>
                      <ul className="space-y-1">
                        {matchResult.strengths.map((strength, index) => (
                          <li key={index} className={`text-sm flex items-start gap-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            <span className="text-green-500 mt-0.5">•</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Missing Requirements
                        </h4>
                      </div>
                      <ul className="space-y-1">
                        {matchResult.missing_requirements.map((missing, index) => (
                          <li key={index} className={`text-sm flex items-start gap-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            <span className="text-yellow-500 mt-0.5">•</span>
                            {missing}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t dark:border-gray-600">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Personalized Recommendations
                      </h4>
                    </div>
                    <ul className="space-y-1">
                      {matchResult.recommendations.map((rec, index) => (
                        <li key={index} className={`text-sm flex items-start gap-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <span className="text-yellow-500 mt-0.5">💡</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {!matchResult && (
                <div className="mt-4 pt-4 border-t dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowProfileForm(true);
                      if (profile.education_level && profile.country) {
                        handleAnalyze(true);
                      }
                    }}
                    className="w-full py-3 bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-500 hover:from-emerald-800 hover:to-lime-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Target className="w-5 h-5" />
                    Match This Opportunity with Your Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Powered by AI • Free to use • Your data stays private</p>
          <p className="mt-1 text-xs">
            Press <kbd className={`px-1.5 py-0.5 rounded text-xs ${
              darkMode ? 'bg-slate-800 text-slate-300' : 'bg-emerald-100 text-emerald-800'
            }`}>Ctrl+Enter</kbd> to analyze
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;