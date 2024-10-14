import express from 'express';
import Sentiment from 'sentiment';
import { AssemblyAI } from 'assemblyai'; // Importing as specified
import multer from 'multer'; // Import multer for handling file uploads
import path from 'path'; // Ensure you import 'path'
import { fileURLToPath } from 'url'; // Needed for ES modules

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

const sentiment = new Sentiment();
const client = new AssemblyAI({
  apiKey: '2b4f3cc3ab554881977d6d769df69313', // Initialize with API key
});

// Configure multer for audio file uploads
const storage = multer.memoryStorage(); // Use memory storage for simplicity
const upload = multer({ storage: storage });

// Serve the main menu (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the sentiment analysis page (sentiment.html)
app.get('/sentiment', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sentiment.html'));
});

// Serve the audio file upload page (audio-upload.html)
app.get('/audio-upload', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'audio-upload.html'));
});

// Endpoint for sentiment analysis
app.post('/analyze', (req, res) => {
    const text = req.body.text;
    const result = sentiment.analyze(text);
    
    let sentimentColor;
    let emoji;

    if (result.score > 0) {
        sentimentColor = 'blue'; // Positive
        emoji = '😊';
    } else if (result.score < 0) {
        sentimentColor = 'red'; // Negative
        emoji = '😞';
    } else {
        sentimentColor = 'grey'; // Neutral
        emoji = '😐';
    }

    res.json({
        score: result.score,
        color: sentimentColor,
        emoji: emoji,
        words: result.words,
    });
});

// Upload audio and transcribe
app.post('/upload-audio', upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No audio file uploaded' });
    }

    // Get the audio buffer from the uploaded file
    const audioBuffer = req.file.buffer;

    // Send the audio buffer to AssemblyAI for transcription
    try {
        const transcript = await client.transcripts.transcribe({
            audio: audioBuffer // Sending the audio buffer directly
        });
        res.json({ transcription: transcript.text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Transcription failed' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
