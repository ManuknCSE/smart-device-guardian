import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # Color definitions
        primary_color = colors.HexColor("#1e3a8a") # Dark Blue
        footer_text_color = colors.HexColor("#64748b") # Slate 500
        line_color = colors.HexColor("#e2e8f0") # Slate 200
        
        # Cover page (Page 1) has a custom layout, no headers/footers
        if self._pageNumber == 1:
            # Draw beautiful blue decorative sidebar on the left
            self.setFillColor(primary_color)
            self.rect(0, 0, 30, 792, fill=True, stroke=False)
            
            # Bottom accent band
            self.setFillColor(colors.HexColor("#0f766e")) # Teal
            self.rect(30, 0, 582, 15, fill=True, stroke=False)
            self.restoreState()
            return
            
        # Draw Header
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(primary_color)
        self.drawString(54, 750, "SMART DEVICE GUARDIAN")
        
        self.setFont("Helvetica", 8)
        self.setFillColor(footer_text_color)
        self.drawRightString(558, 750, "PROJECT SETUP & RUNNING GUIDE")
        
        self.setStrokeColor(line_color)
        self.setLineWidth(0.5)
        self.line(54, 742, 558, 742)
        
        # Draw Footer
        self.line(54, 52, 558, 52)
        
        self.drawString(54, 38, "Confidential — Internal Developer Document")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 38, page_text)
        
        self.restoreState()

def create_guide_pdf(filename="smart_device_guardian_running_guide.pdf"):
    # Margins setup (54 pt = 0.75 inch)
    # Total printable width = 612 - 108 = 504 pt
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    color_primary = colors.HexColor("#1e3a8a")
    color_secondary = colors.HexColor("#0f766e")
    color_text = colors.HexColor("#1e293b")
    
    # Custom Paragraph Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=color_primary,
        spaceAfter=10
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=15,
        leading=20,
        textColor=color_secondary,
        spaceAfter=30
    )
    
    metadata_style = ParagraphStyle(
        'CoverMetadata',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=15,
        textColor=colors.HexColor("#475569")
    )
    
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=color_primary,
        spaceBefore=18,
        spaceAfter=10,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=color_secondary,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=color_text,
        spaceAfter=8
    )

    body_bold = ParagraphStyle(
        'Body_Bold_Custom',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    code_text_style = ParagraphStyle(
        'CodeText',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0f172a")
    )
    
    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )
    
    note_style = ParagraphStyle(
        'NoteText',
        parent=body_style,
        fontName='Helvetica-Oblique',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#7c2d12")
    )

    story = []

    # ---------------------------------------------------------
    # COVER PAGE
    # ---------------------------------------------------------
    story.append(Spacer(1, 100))
    story.append(Paragraph("SMART DEVICE GUARDIAN", title_style))
    story.append(Paragraph("Aging Predictor & IoT Telemetry System", subtitle_style))
    
    story.append(Spacer(1, 40))
    
    # Accent separator bar
    bar_data = [['']]
    bar_table = Table(bar_data, colWidths=[120], rowHeights=[4])
    bar_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), color_secondary),
        ('PADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(bar_table)
    
    story.append(Spacer(1, 40))
    
    desc_p = Paragraph(
        "A comprehensive setup, execution, and architectural guide for running "
        "the predictive maintenance framework. This document details the Flask "
        "REST API, Machine Learning classification model, React-based dashboard, "
        "and physical hardware integration.",
        body_style
    )
    story.append(desc_p)
    
    story.append(Spacer(1, 150))
    
    metadata_text = """
    <b>Author:</b> Antigravity AI Assistant &amp; Developer<br/>
    <b>Target OS:</b> Windows / macOS / Linux<br/>
    <b>Status:</b> Deployment Ready (Verified)<br/>
    <b>Date:</b> May 2026<br/>
    <b>Version:</b> 1.0.0
    """
    story.append(Paragraph(metadata_text, metadata_style))
    story.append(PageBreak())

    # ---------------------------------------------------------
    # SECTION 1: ARCHITECTURAL OVERVIEW
    # ---------------------------------------------------------
    story.append(Paragraph("1. System Architecture", h1_style))
    story.append(Paragraph(
        "The Smart Device Guardian is an end-to-end IoT health monitoring and predictive aging system. "
        "It employs an ML model to analyze real-time device telemetry (temperature, humidity, voltage, and current) "
        "to compute a continuous health score (0-100%) and categorise failure risks.",
        body_style
    ))
    
    # Table of Components
    comp_data = [
        ["Component", "Tech Stack", "Port / Host", "Purpose"],
        ["Frontend Client", "React, Vite, TanStack Router", "localhost:8080", "Interactive dashboard displaying live health charts and chat logs"],
        ["Backend REST API", "Flask, PyMongo, Flask-CORS", "localhost:5000", "Processes uploads, queries databases, and handles AI requests"],
        ["Machine Learning", "Scikit-Learn (Random Forest)", "In-process (joblib)", "Analyzes telemetry to calculate health scores and risk status"],
        ["Database Layer", "MongoDB", "localhost:27017", "Stores persistent sensor telemetry, system logs, and alerts"]
    ]
    comp_table = Table(comp_data, colWidths=[110, 110, 100, 184])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), color_primary),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 8.5),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#f8fafc")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 15))

    # ---------------------------------------------------------
    # SECTION 2: SYSTEM REQUIREMENTS
    # ---------------------------------------------------------
    story.append(Paragraph("2. System Requirements", h1_style))
    story.append(Paragraph("Ensure the host machine has the following tools installed and active:", body_style))
    story.append(Paragraph("• <b>Python 3.9+</b> (Verified on Python 3.11.9)", bullet_style))
    story.append(Paragraph("• <b>Node.js 18.0+</b> (Verified on Node v22.20.0)", bullet_style))
    story.append(Paragraph("• <b>MongoDB Server</b> running locally on default port 27017 (Verified active)", bullet_style))
    story.append(Spacer(1, 10))

    # ---------------------------------------------------------
    # SECTION 3: STEP-BY-STEP SETUP GUIDE
    # ---------------------------------------------------------
    story.append(Paragraph("3. Step-by-Step Setup Guide", h1_style))
    
    story.append(Paragraph("3.1 Backend Configuration & Environment", h2_style))
    story.append(Paragraph(
        "Open a terminal in the project directory. The backend requires a python virtual environment "
        "and package installations. Execute the commands sequentially:",
        body_style
    ))
    
    setup_backend_code = (
        "# 1. Create Python Virtual Environment\n"
        "python -m venv backend/.venv\n\n"
        "# 2. Install Required Packages\n"
        "backend\\.venv\\Scripts\\python -m pip install -r backend/requirements.txt\n\n"
        "# Note: Use backend/.venv/bin/python for macOS/Linux"
    )
    story.append(make_code_block(setup_backend_code, code_text_style))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("3.2 Train the Machine Learning Model", h2_style))
    story.append(Paragraph(
        "Before starting the Flask server, you must train and serialize the predictive model "
        "which estimates device health based on the telemetry features. Run the model training script:",
        body_style
    ))
    
    train_code = "backend\\.venv\\Scripts\\python backend/ml/train_model.py"
    story.append(make_code_block(train_code, code_text_style))
    story.append(Spacer(1, 5))
    story.append(Paragraph(
        "This script generates simulated device wear datasets and saves the model binary to: "
        "<b>`backend/ml/device_health_model.pkl`</b>.",
        body_style
    ))
    story.append(Spacer(1, 8))

    story.append(Paragraph("3.3 Frontend Node Packages Setup", h2_style))
    story.append(Paragraph(
        "To set up the React web interface, install the npm modules in the project root directory:",
        body_style
    ))
    
    setup_frontend_code = "npm install"
    story.append(make_code_block(setup_frontend_code, code_text_style))
    story.append(PageBreak())

    # ---------------------------------------------------------
    # SECTION 4: RUNNING THE APPLICATION
    # ---------------------------------------------------------
    story.append(Paragraph("4. How to Run the Application", h1_style))
    story.append(Paragraph(
        "To run the complete system, both the backend Flask server and the frontend Vite web server "
        "need to run in parallel. Open two terminal instances:",
        body_style
    ))
    
    story.append(Paragraph("Terminal 1: Start Backend Flask Server", h2_style))
    start_backend_code = "backend\\.venv\\Scripts\\python backend/app.py"
    story.append(make_code_block(start_backend_code, code_text_style))
    story.append(Spacer(1, 5))
    story.append(Paragraph(
        "The backend server will run on <b>`http://localhost:5000`</b>. Upon startup, if the database is empty, "
        "the system automatically seeds historical telemetry records into MongoDB for immediate dashboard rendering.",
        body_style
    ))
    story.append(Spacer(1, 8))
    
    story.append(Paragraph("Terminal 2: Start Frontend Web Server", h2_style))
    start_frontend_code = "npm run dev"
    story.append(make_code_block(start_frontend_code, code_text_style))
    story.append(Spacer(1, 5))
    story.append(Paragraph(
        "The frontend Vite web application will launch on <b>`http://localhost:8080/`</b>. "
        "Open this link in your browser to interact with the device portal.",
        body_style
    ))
    story.append(Spacer(1, 10))

    # Note block for GEMINI API KEY
    note_title = Paragraph("<b>Note on AI Integration:</b>", ParagraphStyle('NoteTitle', parent=note_style, fontName='Helvetica-Bold'))
    note_content = Paragraph(
        "To enable the AI Chatbot Assistant, you must configure a Gemini API key. "
        "Create a file named <b>`.env`</b> in the `backend/` directory and populate it as follows:<br/>"
        "<b>`GEMINI_API_KEY=YOUR_ACTUAL_API_KEY`</b>",
        note_style
    )
    
    note_table = Table([[note_title], [note_content]], colWidths=[504])
    note_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fffbeb")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#fef3c7")),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(note_table)
    story.append(Spacer(1, 15))

    # ---------------------------------------------------------
    # SECTION 5: API REFERENCE
    # ---------------------------------------------------------
    story.append(Paragraph("5. API Telemetry Reference", h1_style))
    story.append(Paragraph(
        "The Flask backend provides REST endpoints to submit sensor data and request AI diagnostic reports. "
        "These are exposed on `http://localhost:5000`:",
        body_style
    ))
    
    api_data = [
        ["Endpoint", "Method", "Request Payload", "Description"],
        ["/health", "GET", "None", "Returns API status, MongoDB connection, and model loaded state."],
        ["/api/sensor-data", "POST", "JSON (temp, hum, curr, volt)", "Receives hardware telemetry, evaluates health score and risk, then logs it."],
        ["/api/latest", "GET", "None", "Retrieves the most recent telemetry log stored in MongoDB."],
        ["/api/history", "GET", "None", "Retrieves the last 100 entries for trend analysis and chart rendering."],
        ["/api/ai/predict", "POST", "JSON (temp, hum, curr, volt)", "Runs inputs directly against the Random Forest ML model without logging."],
        ["/api/ai/suggest", "POST", "JSON (temp, healthScore, risk)", "Generates rule-based maintenance checklist recommendations."],
        ["/api/ai/chat", "POST", "JSON (message, context)", "Communicates with Gemini to provide context-aware support."]
    ]
    
    api_table = Table(api_data, colWidths=[110, 50, 140, 204])
    api_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), color_primary),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8.5),
        ('BOTTOMPADDING', (0,0), (-1,0), 5),
        ('TOPPADDING', (0,0), (-1,0), 5),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 8),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#f8fafc")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(api_table)
    story.append(PageBreak())

    # ---------------------------------------------------------
    # SECTION 6: HARDWARE INTEGRATION EXAMPLE
    # ---------------------------------------------------------
    story.append(Paragraph("6. Hardware Integration (Arduino / ESP32)", h1_style))
    story.append(Paragraph(
        "To feed physical micro-controller sensor data to the dashboard, configure your Arduino or ESP32 client "
        "to send an HTTP POST request to `/api/sensor-data`. Below is a sample Arduino C++ code template:",
        body_style
    ))
    
    arduino_code = (
        "#include <WiFi.h>\n"
        "#include <HTTPClient.h>\n"
        "#include <ArduinoJson.h> // Make sure ArduinoJson library is installed\n\n"
        "const char* ssid = \"YOUR_WIFI_SSID\";\n"
        "const char* password = \"YOUR_WIFI_PASSWORD\";\n"
        "// Use the IP address printed by the Flask server log at startup\n"
        "const char* serverAddress = \"http://10.201.11.98:5000/api/sensor-data\";\n\n"
        "void sendTelemetry(float temp, float hum, float curr, float volt) {\n"
        "  if (WiFi.status() == WL_CONNECTED) {\n"
        "    HTTPClient http;\n"
        "    http.begin(serverAddress);\n"
        "    http.addHeader(\"Content-Type\", \"application/json\");\n\n"
        "    StaticJsonDocument<200> doc;\n"
        "    doc[\"temperature\"] = temp;\n"
        "    doc[\"humidity\"] = hum;\n"
        "    doc[\"current\"] = curr;\n"
        "    doc[\"voltage\"] = volt;\n"
        "    doc[\"vibration\"] = \"NORMAL\";\n"
        "    doc[\"relay_status\"] = \"ON\";\n"
        "    doc[\"led_status\"] = \"GREEN\";\n\n"
        "    String requestBody;\n"
        "    serializeJson(doc, requestBody);\n"
        "    int httpResponseCode = http.POST(requestBody);\n"
        "    http.end();\n"
        "  }\n"
        "}"
    )
    story.append(make_code_block(arduino_code, code_text_style))
    story.append(Spacer(1, 10))

    # ---------------------------------------------------------
    # SECTION 7: TROUBLESHOOTING
    # ---------------------------------------------------------
    story.append(Paragraph("7. Troubleshooting & Verification", h1_style))
    
    story.append(Paragraph("Database connection issues", h2_style))
    story.append(Paragraph(
        "If you see a database error in the health check, verify that your MongoDB service is running "
        "and listening on `localhost:27017`. If MongoDB is hosted on a remote cluster or has a username/password, "
        "export the uri as an environment variable before running the script:",
        body_style
    ))
    db_env_code = "set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/smart-device-guardian"
    story.append(make_code_block(db_env_code, code_text_style))
    story.append(Spacer(1, 8))
    
    story.append(Paragraph("ML Model missing error", h2_style))
    story.append(Paragraph(
        "If the backend starts but logs `ML Model file not found`, ensure you ran "
        "<b>`python backend/ml/train_model.py`</b>. Verify that the file `backend/ml/device_health_model.pkl` "
        "exists and is readable.",
        body_style
    ))
    story.append(Spacer(1, 8))

    story.append(Paragraph("CORS errors in the browser console", h2_style))
    story.append(Paragraph(
        "The Flask backend uses `flask-cors` to allow requests originating from `http://localhost:8080`. "
        "Ensure `CORS(app)` remains uncommented in `backend/app.py`.",
        body_style
    ))

    # Build the document using the custom canvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {filename}")

def make_code_block(code_text, style):
    # Format code block neatly in a table cell
    # Escape HTML characters first
    escaped = code_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    formatted = escaped.replace('\n', '<br/>').replace(' ', '&nbsp;')
    p = Paragraph(f"<font face='Courier'>{formatted}</font>", style)
    t = Table([[p]], colWidths=[504])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('PADDING', (0,0), (-1,-1), 8),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    return t

if __name__ == "__main__":
    create_guide_pdf()
