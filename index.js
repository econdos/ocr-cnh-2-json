const e = require('express');
const m = require('multer');
const s = require('child_process').spawn;
const download = require('axios-savefile');
const uuid = require('uuid');
const cors = require('cors');

const a = e();
const p = 8080;
const upload = m({
  dest: '/tmp/',
})

a.use(cors());
a.use(e.static('public'))

const runPy = file => new Promise(function (resolve, reject) {
  const p = s('python', ['-W', 'ignore', 'main.py', '--image', `${file}`]);
  let buf = '';
  p.stdout.on('data', data => {
    buf += data
  });
  p.stdout.on('end', data => {
    resolve(buf);
  });
  p.stderr.on('data', (data) => {
    reject(data);
  });
});

a.post('/cnh.json', upload.single('file'), (r, a, e) => {
  if (!r.file) return a.status(400).json({Error: 'Something went wrong'})
  let file = r.file.path
  runPy(file)
    .then(d => a.json(`${d}`))
    .catch(d => a.status(400).json({Error: `Something went wrong - ${d}`}))
})

a.get('/cnh', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      throw new Error('URL not found')
    }
    const file = `/tmp/${uuid.v4()}_${getFilename(url)}`;
    await download(url, file);
    const data = await runPy(file);
    await res.json(`${data}`);
  } catch (e) {
    res.status(400).json({Error: `Something went wrong - ${e}`})
  }

});
a.listen(p, _ => console.log(`Running on ${p}`));

function getFilename(filename) {
  return filename.split('/').pop();
}
