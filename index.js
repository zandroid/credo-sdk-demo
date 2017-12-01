const express = require('express');
const app = express();
const port = 3002;

app.use(express.static('.'));

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));