from flask import Flask, jsonify, request
from flask_cors import CORS
import whisper
import torch
from diffusers import StableDiffusionPipeline
import base64
import io
from pyngrok import ngrok
import os

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize models with memory optimization
whisper_model = whisper.load_model("medium")

# Optimize Stable Diffusion model
sd_model = StableDiffusionPipeline.from_pretrained("runwayml/stable-diffusion-v1-5")
sd_model.enable_attention_slicing()  # Reduce memory usage
sd_model.to("cuda")

# Home route to check server status
@app.route('/', methods=['GET'])
def home():
    return jsonify({"status": "Server is running"})

# Transcribe route with GET and POST methods
@app.route('/transcribe', methods=['GET', 'POST'])
def generate():
    if request.method == 'GET':
        return jsonify({"status": "Transcribe endpoint is ready"})

    try:
        # Get request data
        data = request.json

        # Check for text or audio input
        text_input = data.get('text', '')
        audio_data = data.get('audio', '')
        filename = data.get('filename', 'temp_audio.mp3')

        # Process audio if present
        if audio_data:
            # Decode base64 audio
            audio_bytes = base64.b64decode(audio_data)

            # Save to a temporary file
            with open(filename, 'wb') as f:
                f.write(audio_bytes)

            # Transcribe audio
            result = whisper_model.transcribe(filename)
            text = result["text"]
        else:
            text = text_input

        # Generate image if text is not empty
        if text.strip():
            # Generate image with reduced inference steps
            with torch.autocast("cuda"):
                with torch.inference_mode():
                    image = sd_model(
                        text,
                        num_inference_steps=20,  # Reduced from 30
                        guidance_scale=7.5  # Typical default
                    ).images[0]

            # Convert to base64
            buffered = io.BytesIO()
            image.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()

            return jsonify({
                'text': text,
                'image': img_str
            })

        return jsonify({'error': 'No text detected'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    ngrok.set_auth_token("2rsixIKt8bxTKPpcGLSt7tlzJJt_6aoJdomfaNKJHYv3kkCih")
    ngrok_tunnel = ngrok.connect(5000)
    print(f"Public URL: {ngrok_tunnel}")
    app.run(host='0.0.0.0', port=5000)