import os
import json
import ee
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from google.oauth2 import service_account
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import BackgroundTasks 

app = FastAPI()

# Automatically handles all browser security permissions
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # Permits any frontend domain link to fetch data
    allow_credentials=False,       # Must be False when using wildcard "*" origins
    allow_methods=["*"],           # Permits all POST and GET options
    allow_headers=["*"],           # Permits all header type formats
)

def secure_cloud_authentication():
    """Headless initialization for Google Earth Engine using a Service Account Key."""
    global gee_ready
    try:
        key_env_var = os.environ.get("EE_SERVICE_ACCOUNT_KEY")
        if not key_env_var:
            print("WARNING: EE_SERVICE_ACCOUNT_KEY variable not detected.")
            return

        # Parse the JSON string from Render environment variables
        key_info = json.loads(key_env_var)
        
        # 1. Use the standard google-auth library to build the token credentials
        # This properly reads the private key string in-memory without looking for a file path
        credentials = service_account.Credentials.from_service_account_info(key_info)
        
        # 2. Append the required Earth Engine authorization scope
        scoped_credentials = credentials.with_scopes(['https://www.googleapis.com/auth/earthengine'])
        
        # 3. Pass the fully authorized credentials directly into Earth Engine's initialization sequence
        ee.Initialize(scoped_credentials, project='stari-remote-intelligence')
        gee_ready = True
        print("Google Earth Engine authenticated successfully via Cloud Service Account.")
    except Exception as e:
        gee_ready = False
        print(f"Bypassing startup token block: {e}")

#def secur_cloud_authentication():
   # """Headless initialization for Google Earth Engine using a Service Account Key."""
    #try:
        # Pull down the key string from your server environment variables
     #   key_env_var = os.environ.get("EE_SERVICE_ACCOUNT_KEY")
      #  if not key_env_var:
       #     print("WARNING: EE_SERVICE_ACCOUNT_KEY variable not detected. GEE will fail to load.")
        #    return

        # Parse string contents to structured service account tokens
       # key_info = json.loads(key_env_var)
        #credentials = service_account.Credentials.from_service_account_info(key_info)
        #scoped_credentials = credentials.with_scopes(['https://googleapis.com/auth/earthengine'])
        
        # Explicitly pass the scoped credentials and project keyword together
       # ee.Initialize(scoped_credentials, project='stari-remote-intelligence')
       # print("Google Earth Engine authenticated successfully via Cloud Service Account.")
    #except Exception as e:
     #   print(f"Critical error initializing Earth Engine background pipeline: {e}")

# Trigger key authorization during app startup phase
secure_cloud_authentication()


def send_satellite_report_email(recipient_email: str, map_url: str):
    """Dispatches the generated Google Earth Engine link directly via free SMTP."""
    sender_email = os.environ.get("SMTP_EMAIL")
    sender_password = os.environ.get("SMTP_PASSWORD")
    
    if not sender_email or not sender_password:
        print("Mailing engine skipped: SMTP environment configurations are missing.")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = f"STARi Command Control <{sender_email}>"
        msg['To'] = recipient_email
        msg['Subject'] = "🛰️ STARi MISSION CONTROL: Your Crop Health Map Vector is Ready"

        body = f"""
        STARi Mission Control Analytics Center
        ---------------------------------------------
        Your requested high-resolution Earth Observation (EO) satellite tracking scan has processed successfully.
        
        The analysis layers have been extracted via Sentinel-2 Multispectral imagery arrays.
        
        🟢 View and Download Your Live NDVI Crop Health Map:
        {map_url}
        
        Note: This secure token web display link is actively hosted by Google Earth Engine infrastructure core layers.
        
        Telemetry Transmission Complete.
        --
        STARi Command
        Space Data Subscriptions & Remote Sensing Intelligence
        """
        msg.attach(MIMEText(body, 'plain'))

        with smtplib.SMTP("://gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, recipient_email, msg.as_string())
            
        print(f"Telemetry email successfully routed to recipient inbox: {recipient_email}")
    except Exception as err:
        print(f"Failed to transmit email dispatch sequence packet: {err}")


# ==========================================
#   THIS IS THE ROOT HANDLER 
# ==========================================
@app.get("/")
def home_index():
    """Bypasses blank root directory 404 drops."""
    return {"status": "STARi Remote Intelligence Engine Online"}


@app.post("/process_ndvi_engine")
async def process_ndvi_engine(request: Request, background_tasks: BackgroundTasks):
    try:
        # 1. Parse coordinate geometry inputs from the website portal
        request_json = await request.json()
        if not request_json or 'coordinates' not in request_json:
            return JSONResponse(
                status_code=400, 
                content={"error": "Missing farm coordinates geometry boundary inputs."}
            )
        
        coords = request_json['coordinates']

        # 2. Construct the tracking geometry polygon from user input
        geometry = ee.Geometry.Polygon(coords)

        # 3. User inputs matching your exact GEE pipeline variables
        start_date = '2026-01-01'
        end_date = '2026-06-10'
        max_cloud = 40

        # 4. Cloud mask engine logic function
        def mask_s2(image):
            scl = image.select('SCL')
            mask = (scl.neq(3)).And(scl.neq(8)).And(scl.neq(9)).And(scl.neq(10))
            return image.updateMask(mask)

        # 5. NDVI function (B8 = NIR, B4 = Red)
        def add_ndvi(image):
            ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
            return image.addBands(ndvi)

        # 6. Run processing core layers query pipelines
        collection = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                      .filterBounds(geometry)
                      .filterDate(start_date, end_date)
                      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', max_cloud))
                      .map(mask_s2)
                      .map(add_ndvi))

        # 7. Create Median NDVI Composite and clip it to the farm geometry
        composite = collection.select('NDVI').median().clip(geometry)

        # 8. Visualization parameters matching your green/yellow/red palette
        vis_params = {
            'min': 0.2,
            'max': 0.8,
            'palette': ['red', 'yellow', 'green']
        }
        
        # 9. Generate an active public web view token tile link parameter map
        map_id_dict = ee.data.getMapId({
            'image': composite,
            'visParams': vis_params
        })

                # --- TEMPORARY DIAGNOSTIC TEST SETUP INSIDE MAIN.PY ---
        generated_url = map_id_dict['tile_fetcher'].url_format

        target_email = request_json.get("email")
        if target_email:
            print(f"DIAGNOSTIC TEST: Attempting direct email routing to {target_email}")
            
            # Change this line:
            # background_tasks.add_task(send_satellite_report_email, target_email, generated_url)
            
            # To this direct call:
            send_satellite_report_email(target_email, generated_url)

        return {
            "status": "success",
            "map_url": generated_url
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

