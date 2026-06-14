import os
import json
import ee
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from google.oauth2 import service_account

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

        key_info = json.loads(key_env_var)
        
        email = key_info.get("client_email")
        private_key = key_info.get("private_key")

        # Create the standard Earth Engine service credentials object
        credentials = ee.ServiceAccountCredentials(email, private_key)
        
        # FIXED: Initialize by passing the credentials directly as the first argument
        ee.Initialize(credentials)
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


# ==========================================
#   THIS IS THE ROOT HANDLER YOU NEED TO ADD
# ==========================================
@app.get("/")
def home_index():
    """Bypasses blank root directory 404 drops."""
    return {"status": "STARi Remote Intelligence Engine Online"}


@app.post("/process_ndvi_engine")
async def process_ndvi_engine(request: Request):
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
            mask = scl.neq(3).and_(scl.neq(8)).and_(scl.neq(9)).and_(scl.neq(10))
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

        # Return the secure tile map URL back to your website portal dashboard
        return {
            "status": "success",
            "map_url": map_id_dict['tile_fetcher'].url_format
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

