# Imagine AI - Text & Audio to Image Generator

Imagine AI is a powerful AI-powered tool that transforms your text descriptions or audio recordings into stunning visual images. Built with cutting-edge technologies like OpenAI's Whisper for audio transcription and Stable Diffusion for image generation, Imagine AI brings your ideas to life with just a few clicks or spoken words.

## Features ✨

* **Text-to-Image Generation:** Convert detailed text descriptions into high-quality images.
* **Audio-to-Image Generation:** Record your voice and let AI generate images based on your spoken descriptions.
* **Multiple Image Styles:** Choose from realistic, cartoon, artistic, and abstract styles.
* **Customizable Image Sizes:** Generate images in small (256x256), medium (512x512), or large (1024x1024) resolutions.
* **History Management:** Save and revisit your generated images with a built-in history feature.
* **Dark Mode:** A sleek dark theme for comfortable usage in low-light environments.
* **Responsive Design:** Works seamlessly on desktops, tablets, and mobile devices.

## Technologies Used 🛠️

* **Frontend:** HTML, CSS, JavaScript
* **Backend:** Python, Flask
* **AI Models:**
    * Whisper (by OpenAI): For audio transcription.
    * Stable Diffusion: For image generation.
* **Libraries:**
    * lamejs: For audio encoding.
    * Font Awesome: For icons.
    * Google Fonts: For typography.
* **Deployment:** Ngrok for tunneling and testing.

## How It Works 🚀

1.  **Text Input:** Enter a detailed description of the image you want to generate.
2.  **Audio Input:** Record your voice describing the image.
3.  **AI Processing:** The backend processes your input using Whisper (for audio) and Stable Diffusion (for image generation).
4.  **Image Generation:** The generated image is displayed on the screen.
5.  **Save & Share:** Download or share your creations with others.

## Installation & Setup 🛠️

### Prerequisites

* Python 3.10 or later
* Node.js (for frontend dependencies)
* FFmpeg (for audio processing)

### Steps

1.  **Clone the Repository:**

    ```bash
    git clone [https://github.com/your-username/imagine-ai.git](https://github.com/your-username/imagine-ai.git)
    cd imagine-ai
    ```

2.  **Set Up the Backend:**

    * Install Python dependencies:

        ```bash
        pip install -r requirements.txt
        ```

    * Run the Flask server:

        ```bash
        python backend.py
        ```

3.  **Set Up the Frontend:**

    * Open `index.html` in your browser or use a local server.

4.  **Configure Ngrok:**

    * Replace the Ngrok auth token in `backend.py` with your own token.
    * Start Ngrok to expose your local server:

        ```bash
        ngrok http 5000
        ```

5.  **Run the Application:**

    * Access the app via the Ngrok URL provided.

## Usage Guide 📖

### Text-to-Image

1.  Enter your text description in the input box.
2.  Click `Generate`.
3.  View your generated image and download or share it.

### Audio-to-Image

1.  Click `Record Description` and speak your idea.
2.  Stop recording when done.
3.  The AI will transcribe your audio and generate an image.

### History

1.  View all your generated images in the `Recent Generations` section.
2.  Clear history if needed.

### Settings

1.  Customize image size, style, and other preferences in the `Settings` panel.

## Contributing 🤝

We welcome contributions! Here's how you can help:

* **Report Bugs:** Open an issue describing the bug.
* **Suggest Features:** Share your ideas for new features.
* **Submit Pull Requests:** Fix bugs or add features and submit a PR.

## License 📜

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Acknowledgments 🙏

* OpenAI for the Whisper model.
* Stability AI for the Stable Diffusion model.
* lamejs for audio encoding.
* Ngrok for tunneling.

## Contact 📧

For questions or feedback, reach out to:

Ibrahim Faisal
Email: ibrahimfaisal3702@gmail.com
GitHub: ibrahim3702
Linkdin: ibrahim3702

Imagine AI - Where Ideas Become Visuals. 🎨✨
