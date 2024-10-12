const express = require('express');
const multer = require('multer');
const Jimp = require('jimp');
const cors = require('cors');

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

app.get('/', (req, res) => {
  res.send('Halftone API is running. Send a POST request to /halftone with an image file to process it.');
});

app.post('/halftone', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const image = await Jimp.read(req.file.buffer);
    const { width, height } = image.bitmap;

    // Apply halftone effect
    image.scan(0, 0, width, height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      const gray = (red + green + blue) / 3;
      const size = 1 - gray / 255;
      const half = size / 2;
      
      if ((x % 4 < size) && (y % 4 < size)) {
        this.bitmap.data[idx + 0] = 0;
        this.bitmap.data[idx + 1] = 0;
        this.bitmap.data[idx + 2] = 0;
      } else {
        this.bitmap.data[idx + 0] = 255;
        this.bitmap.data[idx + 1] = 255;
        this.bitmap.data[idx + 2] = 255;
      }
    });

    const processedImageBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
    res.set('Content-Type', Jimp.MIME_PNG);
    res.send(processedImageBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the image' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});