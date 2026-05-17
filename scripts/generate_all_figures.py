import os
import numpy as np
import matplotlib.pyplot as plt
import networkx as nx

# Create directory for images if it doesn't exist
os.makedirs("images", exist_ok=True)

def save_and_close(name):
    plt.savefig(f"images/{name}", dpi=150, bbox_inches='tight')
    plt.close()

# Figure 1: Eventra Three-Tier Decoupled Architecture
def gen_fig1():
    fig, ax = plt.subplots(figsize=(6, 3))
    box_props = dict(boxstyle="round,pad=0.4", fc="lightblue", ec="navy", lw=1.5)
    
    ax.text(0.15, 0.5, "Client Tier\n(React.js & Tailwind)", ha="center", va="center", bbox=box_props, fontsize=8, fontweight="bold")
    ax.text(0.5, 0.5, "Application Tier\n(Node.js & Express)", ha="center", va="center", bbox=box_props, fontsize=8, fontweight="bold")
    
    db_box = dict(boxstyle="round,pad=0.4", fc="lightgreen", ec="darkgreen", lw=1.5)
    cloud_box = dict(boxstyle="round,pad=0.4", fc="lavender", ec="purple", lw=1.5)
    ax.text(0.85, 0.7, "Database\n(MongoDB Atlas)", ha="center", va="center", bbox=db_box, fontsize=7, fontweight="bold")
    ax.text(0.85, 0.3, "Media Storage\n(Cloudinary CDN)", ha="center", va="center", bbox=cloud_box, fontsize=7, fontweight="bold")
    
    # Arrows
    ax.annotate("", xy=(0.33, 0.5), xytext=(0.28, 0.5), arrowprops=dict(arrowstyle="<->", lw=1.5, color="red"))
    ax.annotate("", xy=(0.72, 0.62), xytext=(0.65, 0.53), arrowprops=dict(arrowstyle="<->", lw=1.5, color="green"))
    ax.annotate("", xy=(0.72, 0.38), xytext=(0.65, 0.47), arrowprops=dict(arrowstyle="->", lw=1.5, color="purple"))
    
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.set_title("Three-Tier Decoupled Architecture (React - Express - MongoDB - Cloudinary)", fontsize=10, fontweight='bold')
    save_and_close("fig1_eventra_arch.png")

# Figure 2: Mongoose Schema Data Relationships
def gen_fig2():
    fig, ax = plt.subplots(figsize=(5.5, 3.5))
    G = nx.DiGraph()
    G.add_edge("User Schema\n(ID, Name, Email, Face_Descriptors)", "Booking Schema\n(ID, User_ID, Event_ID, Date)")
    G.add_edge("Event Schema\n(ID, Title, Slots, Price, Date)", "Booking Schema\n(ID, User_ID, Event_ID, Date)")
    G.add_edge("Booking Schema\n(ID, User_ID, Event_ID, Date)", "Certificate Schema\n(ID, Booking_ID, URL, Hash)")
    
    pos = {
        "User Schema\n(ID, Name, Email, Face_Descriptors)": (-1.5, 1),
        "Event Schema\n(ID, Title, Slots, Price, Date)": (1.5, 1),
        "Booking Schema\n(ID, User_ID, Event_ID, Date)": (0, 0),
        "Certificate Schema\n(ID, Booking_ID, URL, Hash)": (0, -1)
    }
    
    nx.draw_networkx_nodes(G, pos, node_color="lightyellow", node_size=1600, edgecolors="orange", linewidths=1.5, ax=ax)
    nx.draw_networkx_labels(G, pos, font_size=7, font_weight="bold", ax=ax)
    nx.draw_networkx_edges(G, pos, width=1.5, edge_color="gray", arrowstyle="->", arrowsize=12, ax=ax)
    
    ax.set_title("Mongoose Schemas and Relational Data Modeling Mapping", fontsize=9, fontweight='bold')
    ax.axis("off")
    save_and_close("fig2_mongoose_schemas.png")

# Figure 3: JWT Handshake Flow
def gen_fig3():
    fig, ax = plt.subplots(figsize=(5, 3.5))
    box_props = dict(boxstyle="round,pad=0.3", fc="lemonchiffon", ec="gold", lw=1.5)
    
    steps = [
        "1. Client sends credentials (POST /api/auth/login)",
        "2. Backend verifies hash (bcrypt.compare) & fetches User",
        "3. Server signs JWT token (jwt.sign) with private key",
        "4. Token returned to Client & stored in localStorage",
        "5. Subsequence requests attach JWT token in Auth Header",
        "6. Server verifies JWT (jwt.verify) to authorize access"
    ]
    
    for i, step in enumerate(steps):
        ax.text(0.5, 0.9 - i*0.16, step, ha="center", va="center", bbox=box_props, fontsize=8)
        if i < len(steps) - 1:
            ax.annotate("", xy=(0.5, 0.81 - i*0.16), xytext=(0.5, 0.84 - i*0.16),
                        arrowprops=dict(arrowstyle="->", lw=1.2, color="blue"))
            
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.set_title("JWT Authentication Handshake and Authorization Lifecyle Flow", fontsize=10, fontweight='bold')
    save_and_close("fig3_jwt_auth.png")

# Figure 4: Biometric Face Recognition Pipeline
def gen_fig4():
    fig, ax = plt.subplots(figsize=(5.5, 3.5))
    box_props = dict(boxstyle="round,pad=0.4", fc="pink", ec="red", lw=1.5)
    
    steps = [
        "1. Capture webcam stream via HTML5 MediaDevices API",
        "2. Detect face bounds using client-side face-api.js models",
        "3. Collect 25 biometric frames to ensure capture quality",
        "4. Extract 128-dimensional float32 vector descriptor matrix",
        "5. Save descriptor in MongoDB during biometric enrollment",
        "6. Compute Euclidean Distance (threshold < 0.5) to authenticate"
    ]
    
    for i, step in enumerate(steps):
        ax.text(0.5, 0.9 - i*0.16, step, ha="center", va="center", bbox=box_props, fontsize=8)
        if i < len(steps) - 1:
            ax.annotate("", xy=(0.5, 0.81 - i*0.16), xytext=(0.5, 0.84 - i*0.16),
                        arrowprops=dict(arrowstyle="->", lw=1.2, color="red"))
            
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.set_title("Biometric Face Registration and Attendance Pipeline", fontsize=10, fontweight='bold')
    save_and_close("fig4_biometric_pipeline.png")

# Figure 7: React Router mapping
def gen_fig7():
    fig, ax = plt.subplots(figsize=(5.5, 3))
    G = nx.DiGraph()
    routes = {
        "/": "Home\n(Landing/Events)", 
        "/login": "Login\n(Standard/Biometric)", 
        "/register": "Register\n(Ecosystem Profile)", 
        "/dashboard": "User Dashboard\n(Tickets & Attendance)", 
        "/admin": "Admin Panel\n(Event Create / Bulk PDF)"
    }
    G.add_edges_from([("/", "/login"), ("/", "/register"), ("/login", "/dashboard"), ("/login", "/admin")])
    
    pos = {
        "/": (0, 1),
        "/login": (-1, 0),
        "/register": (1, 0),
        "/dashboard": (-1.8, -1),
        "/admin": (-0.2, -1)
    }
    
    nx.draw_networkx_nodes(G, pos, node_color="skyblue", node_size=1200, edgecolors="navy", linewidths=1.5, ax=ax)
    nx.draw_networkx_labels(G, pos, labels=routes, font_size=7, font_weight="bold", ax=ax)
    nx.draw_networkx_edges(G, pos, width=1.5, edge_color="gray", ax=ax)
    
    ax.set_title("React.js Components Router Path and Navigation Mapping", fontsize=10, fontweight='bold')
    ax.axis("off")
    save_and_close("fig7_react_router.png")

# Figure 8: REST API Request Response lifecycle
def gen_fig8():
    fig, ax = plt.subplots(figsize=(5, 3))
    ax.add_patch(plt.Rectangle((0.05, 0.1), 0.35, 0.7, facecolor='lightblue', edgecolor='navy', lw=2))
    ax.add_patch(plt.Rectangle((0.6, 0.1), 0.35, 0.7, facecolor='lightyellow', edgecolor='darkgoldenrod', lw=2))
    
    ax.text(0.225, 0.75, "React Client", ha="center", fontsize=9, fontweight="bold")
    ax.text(0.225, 0.5, "1. API Request\n(Axios Fetch)\nHeaders: Bearer JWT", ha="center", fontsize=7)
    
    ax.text(0.775, 0.75, "Express Backend", ha="center", fontsize=9, fontweight="bold")
    ax.text(0.775, 0.5, "2. Route Match\n3. Verify JWT\n4. DB Query\n5. Generate JSON", ha="center", fontsize=7)
    
    ax.annotate("", xy=(0.6, 0.4), xytext=(0.4, 0.6), arrowprops=dict(facecolor='blue', arrowstyle="->", lw=2))
    ax.annotate("", xy=(0.4, 0.25), xytext=(0.6, 0.25), arrowprops=dict(facecolor='green', arrowstyle="->", lw=2))
    ax.text(0.5, 0.45, "HTTP Post", ha="center", fontsize=6, color="blue")
    ax.text(0.5, 0.18, "JSON Response", ha="center", fontsize=6, color="green")
    
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.set_title("Client-Server RESTful API Request-Response Lifecycle Flow", fontsize=10, fontweight='bold')
    save_and_close("fig8_api_lifecycle.png")

# Figure 12: Certificate Template Layout
def gen_fig12():
    fig, ax = plt.subplots(figsize=(5.5, 3.2))
    ax.add_patch(plt.Rectangle((0, 0), 1, 1, facecolor='#fbf8f3', edgecolor='darkgoldenrod', lw=3))
    ax.add_patch(plt.Rectangle((0.03, 0.03), 0.94, 0.94, fill=False, edgecolor='darkgoldenrod', lw=1))
    
    ax.text(0.5, 0.85, "EVENTRA CERTIFICATE OF PARTICIPATION", ha="center", fontsize=11, fontweight="bold", color="navy")
    ax.text(0.5, 0.70, "This is to certify that", ha="center", fontsize=8, style="italic")
    ax.text(0.5, 0.55, "[ PARTICIPANT NAME ]", ha="center", fontsize=12, fontweight="bold", color="darkred")
    ax.text(0.5, 0.42, "has successfully registered and attended the event", ha="center", fontsize=8)
    ax.text(0.5, 0.32, "[ EVENT WORKSHOP TITLE ]", ha="center", fontsize=10, fontweight="bold")
    ax.text(0.5, 0.22, "Held at Tula's Institute, Dehradun on [ EVENT DATE ]", ha="center", fontsize=7)
    
    # Signature line
    ax.plot([0.15, 0.35], [0.12, 0.12], 'k-', lw=0.8)
    ax.text(0.25, 0.08, "Authorized Signature", ha="center", fontsize=6)
    
    # QR verification space
    ax.add_patch(plt.Rectangle((0.7, 0.08), 0.15, 0.15, facecolor='white', edgecolor='black'))
    ax.text(0.775, 0.14, "[ QR ]", ha="center", fontsize=7)
    
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.set_title("PDF Dynamic Certificate Template Wireframe Component", fontsize=9, fontweight='bold')
    save_and_close("fig12_cert_template.png")

# Figure 13: Admin Dashboard UI Layout
def gen_fig13():
    fig, ax = plt.subplots(figsize=(5.5, 3))
    ax.add_patch(plt.Rectangle((0, 0), 1, 1, facecolor='#f7f9fa', edgecolor='navy', lw=2))
    # Navbar
    ax.add_patch(plt.Rectangle((0, 0.82), 1, 0.18, facecolor='#2c3e50'))
    ax.text(0.05, 0.9, "Eventra Admin Dashboard", color="white", fontsize=9, fontweight='bold')
    
    # Analytics boxes
    ax.add_patch(plt.Rectangle((0.05, 0.48), 0.26, 0.28, facecolor='white', edgecolor='#ccc'))
    ax.text(0.18, 0.65, "Total Users", ha="center", color="gray", fontsize=7)
    ax.text(0.18, 0.53, "342", ha="center", color="navy", fontsize=12, fontweight="bold")
    
    ax.add_patch(plt.Rectangle((0.37, 0.48), 0.26, 0.28, facecolor='white', edgecolor='#ccc'))
    ax.text(0.5, 0.65, "Active Events", ha="center", color="gray", fontsize=7)
    ax.text(0.5, 0.53, "18", ha="center", color="navy", fontsize=12, fontweight="bold")
    
    ax.add_patch(plt.Rectangle((0.69, 0.48), 0.26, 0.28, facecolor='white', edgecolor='#ccc'))
    ax.text(0.82, 0.65, "Bookings Made", ha="center", color="gray", fontsize=7)
    ax.text(0.82, 0.53, "1,208", ha="center", color="navy", fontsize=12, fontweight="bold")
    
    # Operations
    ax.add_patch(plt.Rectangle((0.05, 0.12), 0.42, 0.28, facecolor='lightgreen', edgecolor='darkgreen'))
    ax.text(0.26, 0.22, "✓ Create Event", ha="center", fontsize=8, fontweight="bold")
    
    ax.add_patch(plt.Rectangle((0.53, 0.12), 0.42, 0.28, facecolor='pink', edgecolor='darkred'))
    ax.text(0.74, 0.22, "💾 Export Certificates", ha="center", fontsize=8, fontweight="bold")
    
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.set_title("Admin Dashboard Analytical Controls and Operational Board", fontsize=9, fontweight='bold')
    save_and_close("fig13_admin_dashboard.png")

# Figure 14: System DFD Level 0 (Context Level)
def gen_fig14():
    fig, ax = plt.subplots(figsize=(5.5, 3))
    # DFD Level 0
    ax.add_patch(plt.Circle((0.5, 0.5), 0.18, facecolor='lavender', edgecolor='purple', lw=2))
    ax.text(0.5, 0.5, "Eventra System\n(Context Portal)", ha="center", va="center", fontsize=8, fontweight="bold")
    
    # External entities
    box_p = dict(boxstyle="square,pad=0.4", fc="lightblue", ec="navy", lw=1.5)
    ax.text(0.12, 0.5, "User /\nParticipant", ha="center", va="center", bbox=box_p, fontsize=8, fontweight="bold")
    ax.text(0.88, 0.5, "System\nAdministrator", ha="center", va="center", bbox=box_p, fontsize=8, fontweight="bold")
    
    # Arrows User
    ax.annotate("Browse / Register / Book", xy=(0.31, 0.55), xytext=(0.22, 0.55), arrowprops=dict(arrowstyle="->", lw=1.2, color="navy"))
    ax.annotate("Send JWT / Ticket PDF", xy=(0.22, 0.45), xytext=(0.31, 0.45), arrowprops=dict(arrowstyle="->", lw=1.2, color="navy"))
    
    # Arrows Admin
    ax.annotate("Manage Events / Export ZIP", xy=(0.69, 0.55), xytext=(0.78, 0.55), arrowprops=dict(arrowstyle="<-", lw=1.2, color="darkgreen"))
    ax.annotate("Receive System Report", xy=(0.78, 0.45), xytext=(0.69, 0.45), arrowprops=dict(arrowstyle="<-", lw=1.2, color="darkgreen"))
    
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.set_title("System DFD Level 0 (Context Level Diagram)", fontsize=10, fontweight='bold')
    save_and_close("fig14_dfd_lvl0.png")

# Figure 15: System DFD Level 1
def gen_fig15():
    fig, ax = plt.subplots(figsize=(5.5, 3.5))
    box_p = dict(boxstyle="round,pad=0.2", fc="white", ec="black")
    
    # Processes
    ax.text(0.2, 0.8, "Process 1.0\nRegistration", ha="center", va="center", bbox=box_p, fontsize=7)
    ax.text(0.5, 0.8, "Process 2.0\nTicket Booking", ha="center", va="center", bbox=box_p, fontsize=7)
    ax.text(0.8, 0.8, "Process 3.0\nAttendance Verification", ha="center", va="center", bbox=box_p, fontsize=7)
    
    # Data Stores
    ax.text(0.35, 0.3, "== [D1] Users Store ==", ha="center", va="center", color="navy", fontsize=8, fontweight="bold")
    ax.text(0.65, 0.3, "== [D2] Bookings Store ==", ha="center", va="center", color="navy", fontsize=8, fontweight="bold")
    
    # Arrows
    ax.annotate("", xy=(0.3, 0.4), xytext=(0.2, 0.72), arrowprops=dict(arrowstyle="->", lw=1.0, color="gray"))
    ax.annotate("", xy=(0.48, 0.72), xytext=(0.38, 0.4), arrowprops=dict(arrowstyle="->", lw=1.0, color="gray"))
    ax.annotate("", xy=(0.58, 0.4), xytext=(0.5, 0.72), arrowprops=dict(arrowstyle="->", lw=1.0, color="gray"))
    ax.annotate("", xy=(0.75, 0.72), xytext=(0.68, 0.4), arrowprops=dict(arrowstyle="->", lw=1.0, color="gray"))
    
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.set_title("System DFD Level 1 (Data Flows and Database Updates Diagram)", fontsize=10, fontweight='bold')
    save_and_close("fig15_dfd_lvl1.png")

# Figure 16: Entity Relationship Diagram (ERD)
def gen_fig16():
    fig, ax = plt.subplots(figsize=(5.5, 3.5))
    G = nx.DiGraph()
    
    G.add_edge("USER\n(1)", "BOOKING\n(N)")
    G.add_edge("EVENT\n(1)", "BOOKING\n(N)")
    G.add_edge("BOOKING\n(N)", "CERTIFICATE\n(1)")
    
    pos = {
        "USER\n(1)": (-1.5, 1),
        "EVENT\n(1)": (1.5, 1),
        "BOOKING\n(N)": (0, 0),
        "CERTIFICATE\n(1)": (0, -1)
    }
    
    nx.draw_networkx_nodes(G, pos, node_color="pink", node_size=1400, edgecolors="red", linewidths=1.5, ax=ax)
    nx.draw_networkx_labels(G, pos, font_size=8, font_weight="bold", ax=ax)
    nx.draw_networkx_edges(G, pos, width=1.5, edge_color="navy", arrowstyle="->", arrowsize=15, ax=ax)
    
    ax.set_title("Entity Relationship Diagram (ERD) and Schema Multiplicity Mapping", fontsize=10, fontweight='bold')
    ax.axis("off")
    save_and_close("fig16_erd.png")

# Figure 17: Mongoose transactional seat deduction
def gen_fig17():
    fig, ax = plt.subplots(figsize=(5.5, 3.5))
    box_props = dict(boxstyle="round,pad=0.3", fc="lightblue", ec="navy", lw=1.5)
    
    steps = [
        "1. Initialize Transaction Session (mongoose.startSession)",
        "2. Acquire Session Lock & startTransaction() boundary",
        "3. Read Event data & check if availableSlots > 0",
        "4. Decrement availableSlots & append User ID to participants",
        "5. Save Event document & generate Booking record",
        "6. Commit Transaction Session (session.commitTransaction)"
    ]
    
    for i, step in enumerate(steps):
        ax.text(0.5, 0.9 - i*0.16, step, ha="center", va="center", bbox=box_props, fontsize=8)
        if i < len(steps) - 1:
            ax.annotate("", xy=(0.5, 0.81 - i*0.16), xytext=(0.5, 0.84 - i*0.16),
                        arrowprops=dict(arrowstyle="->", lw=1.2, color="navy"))
            
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.set_title("Mongoose Session Transaction Flowchart for Double-Booking Prevention", fontsize=9, fontweight='bold')
    save_and_close("fig17_mongoose_transaction.png")

# Figure 18: Biometric Match Euclidean Distance threshold
def gen_fig18():
    fig, ax = plt.subplots(figsize=(5, 3))
    # Euclidean distance graph
    x = np.linspace(0, 1.2, 100)
    y = np.exp(-x**2 * 4) # Match confidence curve
    
    ax.plot(x, y, color="blue", lw=2, label="Face Match Confidence")
    ax.axvline(0.5, color="red", ls="--", lw=1.5, label="Euclidean Threshold (0.5)")
    
    ax.fill_between(x, y, where=(x <= 0.5), facecolor='lightgreen', alpha=0.3, label="Match Approved")
    ax.fill_between(x, y, where=(x > 0.5), facecolor='pink', alpha=0.3, label="Match Rejected")
    
    ax.set_xlabel("Euclidean Distance Vector Metric")
    ax.set_ylabel("Match Confidence Index")
    ax.set_title("Biometric Match Confidence Curve by Euclidean Vector Distance", fontsize=9, fontweight='bold')
    ax.legend(loc="upper right", fontsize=7)
    ax.grid(True, linestyle=":", alpha=0.6)
    save_and_close("fig18_euclidean_distance.png")

# Figure 19: Bulk Zip generation pipeline
def gen_fig19():
    fig, ax = plt.subplots(figsize=(5.5, 3.5))
    box_props = dict(boxstyle="round,pad=0.3", fc="lavender", ec="purple", lw=1.5)
    
    steps = [
        "1. Admin requests bulk export ZIP of earned credentials",
        "2. Query Bookings database & fetch participant list",
        "3. Loop over records & generate individual PDF certificates",
        "4. Stream PDFs into an in-memory archiver ZIP instance",
        "5. Compile ZIP structure & write global binary stream buffer",
        "6. Return ZIP file download response to Admin browser client"
    ]
    
    for i, step in enumerate(steps):
        ax.text(0.5, 0.9 - i*0.16, step, ha="center", va="center", bbox=box_props, fontsize=8)
        if i < len(steps) - 1:
            ax.annotate("", xy=(0.5, 0.81 - i*0.16), xytext=(0.5, 0.84 - i*0.16),
                        arrowprops=dict(arrowstyle="->", lw=1.2, color="purple"))
            
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.set_title("Administrative Bulk Certificate ZIP Archival and Generation Pipeline", fontsize=9, fontweight='bold')
    save_and_close("fig19_bulk_zip.png")

# Generate all Eventra custom diagrams
gen_fig1()
gen_fig2()
gen_fig3()
gen_fig4()
gen_fig7()
gen_fig8()
gen_fig12()
gen_fig13()
gen_fig14()
gen_fig15()
gen_fig16()
gen_fig17()
gen_fig18()
gen_fig19()

print("Successfully generated all Eventra custom diagrams in images/ directory!")
