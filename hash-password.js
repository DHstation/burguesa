// Script temporário para gerar hash de senha
const bcrypt = require('bcryptjs');

const password = 'admin123';
const hash = bcrypt.hashSync(password, 10);

console.log('\n===========================================');
console.log('Hash gerado com sucesso!');
console.log('===========================================');
console.log('\nSenha original:', password);
console.log('\nHash (copie isso):\n');
console.log(hash);
console.log('\n===========================================\n');
