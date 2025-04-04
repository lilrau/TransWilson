const bcrypt = require("bcryptjs");

// Função para gerar o hash da senha
async function generateHash(password) {
  try {
    const saltRounds = 10; // Número de rounds para o salt
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("Senha original:", password);
    console.log("Hash gerado:", hashedPassword);
  } catch (error) {
    console.error("Erro ao gerar o hash:", error);
  }
}

// Substitua "sua_senha_aqui" pela senha que deseja hashear
const password = "cainan.admin";
generateHash(password);