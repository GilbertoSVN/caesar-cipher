const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');
const FormData = require('form-data');

const token = '[SEU TOKEN]';

const filePath = 'answer.json';

const api = axios.create({
  baseURL: 'https://api.codenation.dev/v1/challenge/dev-ps/'
});

console.log('Start!');

(async () => {
  fs.exists(filePath, exist => {
    if (exist) {
      fs.unlink(filePath, err => {
        if (err) return console.log(err);
      });
    }
  });

  const { data } = await api.get(`generate-data?token=${token}`);

  let { numero_casas, cifrado, decifrado, resumo_criptografico } = data;
  cifrado = cifrado.toLowerCase();

  [...cifrado].forEach(char => {
    if (char.charCodeAt(0) >= 97 && char.charCodeAt(0) <= 122) {
      if (char.charCodeAt(0) - numero_casas < 97) {
        decifrado += String.fromCharCode(
          char.charCodeAt(0) - numero_casas + 26
        );
      } else {
        decifrado += String.fromCharCode(char.charCodeAt(0) - numero_casas);
      }
    } else {
      decifrado += char;
    }
  });

  resumo_criptografico = crypto
    .createHash('sha1')
    .update(decifrado, 'utf8')
    .digest('hex');

  let answer = data;

  answer.decifrado = decifrado;
  answer.resumo_criptografico = resumo_criptografico;

  fs.writeFile(filePath, JSON.stringify(answer), 'utf8', function(err) {
    if (err) throw err;
  });

  const file = fs.createReadStream(filePath);

  const formData = new FormData();

  formData.append('answer', file, file.name);

  api
    .post(`submit-solution?token=${token}`, formData, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`
      }
    })
    .then(() => {
      console.log('Enviado com sucesso!');
    })
    .catch(err => console.log(err));
})();
