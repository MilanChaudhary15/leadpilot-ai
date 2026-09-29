import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

const emptyForm = {
  name: "",
  location: "",
  property_requirement: "",
  budget: "",
  buying_timeline: "",
  customer_message: "",
};

function App() {
  
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [followUpTasks, setFollowUpTasks] = useState([]);

  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");

  const [showAddLead, setShowAddLead] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function sendChatMessage() {
    const message = chatInput.trim();

    if (!message || !selectedLead) {
      return;
    }

    const userMessage = {
      role: "user",
      content: message,
    };

    setChatMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setChatInput("");
    setChatLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/leads/${selectedLead.id}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "AI assistant failed"
        );
      }

      setChatMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);

    } catch (err) {

      setChatMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't process that question.",
        },
      ]);

      setError(err.message);

    } finally {

      setChatLoading(false);
    }
  }

  async function loadLeads(selectFirst = true) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/leads`);

      if (!response.ok) {
        throw new Error("Failed to load leads");
      }

      const data = await response.json();

      setLeads(data);

      if (selectFirst && data.length > 0) {
        setSelectedLead(data[0]);
        initializeFollowUpTasks(data[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function analyzeLead(leadId) {
    try {
      setAnalyzing(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/leads/${leadId}/analyze`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "AI analysis failed");
      }

      setSelectedLead(data);
      initializeFollowUpTasks(data);
      setChatMessages([]);

      setLeads((previousLeads) =>
        previousLeads.map((lead) =>
          lead.id === data.id ? data : lead
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  function initializeFollowUpTasks(lead) {
    if (!lead) {
      setFollowUpTasks([]);
      return;
    }
  
    const storageKey = `leadpilot_tasks_${lead.id}`;
  
    const savedTasks = localStorage.getItem(storageKey);
  
    if (savedTasks) {
      setFollowUpTasks(JSON.parse(savedTasks));
      return;
    }
  
    const defaultTasks = [
      {
        id: 1,
        text: "Contact customer",
        completed: false,
      },
      {
        id: 2,
        text: "Confirm property preferences",
        completed: false,
      },
      {
        id: 3,
        text: "Review matching inventory",
        completed: false,
      },
      {
        id: 4,
        text: "Schedule site visit",
        completed: false,
      },
    ];
  
    setFollowUpTasks(defaultTasks);
  
    localStorage.setItem(
      storageKey,
      JSON.stringify(defaultTasks)
    );
  }

  function toggleFollowUpTask(taskId) {
    setFollowUpTasks((previousTasks) => {
      const updatedTasks = previousTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
            }
          : task
      );

      if (selectedLead) {
        localStorage.setItem(
          `leadpilot_tasks_${selectedLead.id}`,
          JSON.stringify(updatedTasks)
        );
      }

      return updatedTasks;
    });
  }

  useEffect(() => {
    if (!selectedLead) {
      return;
    }

    const storageKey = `leadpilot_tasks_${selectedLead.id}`;

    const savedTasks = localStorage.getItem(storageKey);

    if (savedTasks) {
      setFollowUpTasks(JSON.parse(savedTasks));
    }
  }, [selectedLead]);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  async function createLead(event) {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");

      const response = await fetch(`${API_URL}/api/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        if (Array.isArray(data.detail)) {
          throw new Error(
            data.detail
              .map((item) => item.msg)
              .join(", ")
          );
        }

        throw new Error(
          data.detail || "Failed to create lead"
        );
      }

      // Add the new lead to the dashboard
      setLeads((previousLeads) => [
        data,
        ...previousLeads,
      ]);

      // Select the newly created lead
      setSelectedLead(data);

      // Reset form
      setForm(emptyForm);

      // Close modal
      setShowAddLead(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function openAddLead() {
    setError("");
    setForm(emptyForm);
    setShowAddLead(true);
  }

  function closeAddLead() {
    if (creating) return;

    setShowAddLead(false);
    setForm(emptyForm);
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const hotCount = leads.filter(
    (lead) => lead.priority === "HOT"
  ).length;

  const warmCount = leads.filter(
    (lead) => lead.priority === "WARM"
  ).length;

  const coldCount = leads.filter(
    (lead) => lead.priority === "COLD"
  ).length;

  return (
    <div className="app">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            L
          </div>

          <div>
            <h1>LeadPilot</h1>
            <p>AI Sales Assistant</p>
          </div>

        </div>

        <nav>

          <button className="nav-item active">
            <span>◉</span>
            Leads
          </button>

          <button className="nav-item">
            <span>▣</span>
            Analytics
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="ai-status">

            <span className="status-dot"></span>

            <div>
              <strong>AI Online</strong>
              <small>Gemini connected</small>
            </div>

          </div>

        </div>

      </aside>

      {/* Main */}
      <main className="main">

        {/* Header */}
        <header className="topbar">

          <div>
            <h2>Lead Dashboard</h2>

            <p>
              Prioritize leads and turn conversations into action.
            </p>
          </div>

          <div className="topbar-actions">

            <button
              className="add-lead-button"
              onClick={openAddLead}
            >
              + Add New Lead
            </button>

            <button
              className="refresh-button"
              onClick={() => loadLeads(false)}
            >
              ↻ Refresh
            </button>

          </div>

        </header>

        {/* Error */}
        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {/* Stats */}
        <section className="stats">

          <div className="stat-card">
            <span>Total Leads</span>
            <strong>{leads.length}</strong>
          </div>

          <div className="stat-card hot">
            <span>Hot Leads</span>
            <strong>{hotCount}</strong>
          </div>

          <div className="stat-card warm">
            <span>Warm Leads</span>
            <strong>{warmCount}</strong>
          </div>

          <div className="stat-card cold">
            <span>Cold Leads</span>
            <strong>{coldCount}</strong>
          </div>

        </section>

        <section className="dashboard">

          {/* Lead list */}
          <div className="lead-panel">

            <div className="panel-header">

              <div>
                <h3>Priority Queue</h3>

                <p>
                  Leads ranked by AI-assisted scoring
                </p>
              </div>

            </div>

            {loading ? (

              <div className="empty">
                Loading leads...
              </div>

            ) : leads.length === 0 ? (

              <div className="empty">
                No leads found. Add your first lead.
              </div>

            ) : (

              <div className="lead-list">

                {[...leads]
                  .sort(
                    (a, b) =>
                      (b.score || 0) -
                      (a.score || 0)
                  )
                  .map((lead) => (

                    <button
                      key={lead.id}
                      className={`lead-card ${
                        selectedLead?.id === lead.id
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>{
                        setSelectedLead(lead);
                        initializeFollowUpTasks(lead);
                        setChatMessages([]);
                      }}
                    >

                      <div className="lead-top">

                        <strong>
                          {lead.name}
                        </strong>

                        {lead.priority && (
                          <span
                            className={`priority ${lead.priority.toLowerCase()}`}
                          >
                            {lead.priority}
                          </span>
                        )}

                      </div>

                      <p>
                        {lead.property_requirement}
                      </p>

                      <div className="lead-meta">

                        <span>
                          {lead.location}
                        </span>

                        {lead.budget && (
                          <span>
                            {lead.budget}
                          </span>
                        )}

                      </div>

                      {lead.score !== undefined && (
                        <div className="score">

                          <span>
                            Score
                          </span>

                          <strong>
                            {lead.score}
                          </strong>

                        </div>
                      )}

                    </button>

                  ))}

              </div>

            )}

          </div>

          {/* Lead details */}
          <div className="details-panel">

            {!selectedLead ? (

              <div className="empty">
                Select a lead to view details.
              </div>

            ) : (

              <>

                <div className="details-header">

                  <div>

                    <div className="name-row">

                      <h2>
                        {selectedLead.name}
                      </h2>

                      {selectedLead.priority && (
                        <span
                          className={`priority ${selectedLead.priority.toLowerCase()}`}
                        >
                          {selectedLead.priority}
                        </span>
                      )}

                    </div>

                    <p>
                      {selectedLead.location} ·{" "}
                      {selectedLead.property_requirement}
                    </p>

                  </div>

                  <div className="score-large">

                    <strong>
                      {selectedLead.score ?? "--"}
                    </strong>

                    <span>
                      / 100
                    </span>

                  </div>

                </div>

                {/* Customer information */}
                <div className="info-grid">

                  <div>
                    <span>
                      Budget
                    </span>

                    <strong>
                      {selectedLead.budget ||
                        "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Timeline
                    </span>

                    <strong>
                      {selectedLead.buying_timeline ||
                        "Not specified"}
                    </strong>
                  </div>

                </div>

                {/* Customer message */}
                <section className="content-section">

                  <h3>
                    Customer Message
                  </h3>

                  <div className="message-box">
                    {selectedLead.customer_message}
                  </div>

                </section>

                {!selectedLead.summary ? (

                  <div className="analysis-placeholder">

                    <div>

                      <h3>
                        AI Analysis
                      </h3>

                      <p>
                        Analyze this lead with Gemini
                        to generate summary, intent,
                        requirements, concerns,
                        and next action.
                      </p>

                    </div>

                    <button
                      className="analyze-button"
                      disabled={analyzing}
                      onClick={() =>
                        analyzeLead(
                          selectedLead.id
                        )
                      }
                    >
                      {analyzing
                        ? "Analyzing..."
                        : "✦ Analyze with AI"}
                    </button>

                  </div>

                ) : (

                  <>

                    {/* Summary */}
                    <section className="content-section">

                      <h3>
                        AI Summary
                      </h3>

                      <p className="summary">
                        {selectedLead.summary}
                      </p>

                    </section>

                    {/* Analysis grid */}
                    <div className="analysis-grid">

                      <div className="analysis-card">

                        <span className="section-label">
                          CUSTOMER INTENT
                        </span>

                        <p>
                          {selectedLead.intent}
                        </p>

                      </div>

                      <div className="analysis-card">

                        <span className="section-label">
                          NEXT BEST ACTION
                        </span>

                        <p>
                          {selectedLead.recommended_action}
                        </p>

                      </div>

                    </div>

                    {/* Requirements */}
                    <section className="content-section">

                      <h3>
                        Key Requirements
                      </h3>

                      <div className="tags">

                        {selectedLead.requirements?.map(
                          (requirement, index) => (
                            <span
                              className="tag"
                              key={index}
                            >
                              {requirement}
                            </span>
                          )
                        )}

                      </div>

                    </section>

                    {/* Concerns */}
                    <section className="content-section">

                      <h3>
                        Objections & Concerns
                      </h3>

                      {selectedLead.objections?.length ? (

                        <ul className="concerns">

                          {selectedLead.objections.map(
                            (objection, index) => (
                              <li key={index}>
                                {objection}
                              </li>
                            )
                          )}

                        </ul>

                      ) : (

                        <p className="muted">
                          No major objections identified.
                        </p>

                      )}

                    </section>

                    {/* Suggested response */}
                    <section className="content-section">

                      <h3>
                        Suggested Response
                      </h3>

                      <div className="response-box">
                        {selectedLead.suggested_response}
                      </div>

                    </section>

                    {/* Follow-up */}
                    <section className="content-section">

                      <h3>
                        Follow-up Plan
                      </h3>

                      <p className="summary">
                        {selectedLead.follow_up_plan}
                      </p>
                      
                      </section>

                      {/* Next Best Action + Follow-up Tracker */}
                      <section className="action-tracker">

                        <div className="action-tracker-header">

                          <div>
                            <span className="section-label">
                              SALES ACTION CENTER
                            </span>

                            <h3>
                              Next Best Action
                            </h3>

                            <p>
                              {selectedLead.recommended_action}
                            </p>
                          </div>

                          <div className="action-badge">
                            {selectedLead.priority === "HOT"
                              ? "Act Now"
                              : selectedLead.priority === "WARM"
                              ? "Follow Up"
                              : "Nurture"}
                          </div>
                            
                        </div>
                            
                        <div className="task-section">
                            
                          <div className="task-header">
                            
                            <h4>
                              Follow-up Tracker
                            </h4>
                            
                            <span>
                              {
                                followUpTasks.filter(
                                  (task) => task.completed
                                ).length
                              }
                              /
                              {followUpTasks.length} completed
                            </span>
                            
                          </div>
                            
                          <div className="task-list">
                            
                            {followUpTasks.map((task) => (
                            
                              <label
                                key={task.id}
                                className={`task-item ${
                                  task.completed
                                    ? "completed"
                                    : ""
                                }`}
                              >
                              
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={() =>
                                    toggleFollowUpTask(task.id)
                                  }
                                />

                                <span>
                                  {task.text}
                                </span>
                                
                              </label>

                            ))}

                          </div>
                          
                        </div>
                          
                      </section>
                      
                      {/* AI Sales Assistant */}
                      <section className="assistant-panel">

                        <div className="assistant-header">

                          <div>
                            <h3>
                              AI Sales Assistant
                            </h3>

                            <p>
                              Ask questions about this lead
                            </p>
                          </div>

                        </div>

                        <div className="chat-messages">

                          {chatMessages.length === 0 && (
                          
                            <div className="chat-empty">
                            
                              <p>
                                Ask me anything about this lead.
                              </p>
                          
                              <div className="suggested-questions">
                          
                                <button
                                  onClick={() =>
                                    setChatInput(
                                      "What should I ask on my first call?"
                                    )
                                  }
                                >
                                  What should I ask on my first call?
                                </button>
                                
                                <button
                                  onClick={() =>
                                    setChatInput(
                                      "Why is this lead high priority?"
                                    )
                                  }
                                >
                                  Why is this lead high priority?
                                </button>
                                
                                <button
                                  onClick={() =>
                                    setChatInput(
                                      "What are the main customer requirements?"
                                    )
                                  }
                                >
                                  What are the main requirements?
                                </button>
                                
                              </div>
                                
                            </div>

                          )}

                          {chatMessages.map((message, index) => (
                          
                            <div
                              key={index}
                              className={`chat-message ${message.role}`}
                            >
                            
                              <div className="chat-bubble">
                                {message.content}
                              </div>
                          
                            </div>

                          ))}

                          {chatLoading && (
                          
                            <div className="chat-message assistant">
                            
                              <div className="chat-bubble">
                                Thinking...
                              </div>
                          
                            </div>

                          )}

                        </div>
                        
                        <div className="chat-input-area">
                        
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(event) =>
                              setChatInput(event.target.value)
                            }
                            onKeyDown={(event) => {
                            
                              if (event.key === "Enter") {
                                sendChatMessage();
                              }
                            
                            }}
                            placeholder="Ask about this lead..."
                            disabled={chatLoading}
                          />

                          <button
                            onClick={sendChatMessage}
                            disabled={
                              chatLoading ||
                              !chatInput.trim()
                            }
                          >
                            Send
                          </button>
                          
                        </div>
                          
                      </section>

                  </>

                )}

              </>

            )}

          </div>

        </section>

      </main>

      {/* Add Lead Modal */}
      {showAddLead && (

        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeAddLead();
            }
          }}
        >

          <div className="modal">

            <div className="modal-header">

              <div>
                <h2>
                  Add New Lead
                </h2>

                <p>
                  Enter customer details to create a new lead.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeAddLead}
                disabled={creating}
              >
                ×
              </button>

            </div>

            <form onSubmit={createLead}>

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Customer Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Rahul Sharma"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Location
                  </label>

                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleFormChange}
                    placeholder="e.g. Bhopal"
                    required
                  />

                </div>

              </div>

              <div className="form-group">

                <label>
                  Property Requirement
                </label>

                <input
                  type="text"
                  name="property_requirement"
                  value={form.property_requirement}
                  onChange={handleFormChange}
                  placeholder="e.g. 3 BHK apartment"
                  required
                />

              </div>

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Budget
                  </label>

                  <input
                    type="text"
                    name="budget"
                    value={form.budget}
                    onChange={handleFormChange}
                    placeholder="e.g. ₹80–90 lakh"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Buying Timeline
                  </label>

                  <select
                    name="buying_timeline"
                    value={form.buying_timeline}
                    onChange={handleFormChange}
                    required
                  >

                    <option value="">
                      Select timeline
                    </option>

                    <option value="Within 1 month">
                      Within 1 month
                    </option>

                    <option value="1–3 months">
                      1–3 months
                    </option>

                    <option value="3–6 months">
                      3–6 months
                    </option>

                    <option value="6–12 months">
                      6–12 months
                    </option>

                    <option value="More than 1 year">
                      More than 1 year
                    </option>

                    <option value="Just exploring">
                      Just exploring
                    </option>

                  </select>

                </div>

              </div>

              <div className="form-group">

                <label>
                  Customer Message
                </label>

                <textarea
                  name="customer_message"
                  value={form.customer_message}
                  onChange={handleFormChange}
                  placeholder="Enter the customer's message or requirements..."
                  rows="5"
                  required
                />

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeAddLead}
                  disabled={creating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={creating}
                >
                  {creating
                    ? "Creating..."
                    : "Create Lead"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);