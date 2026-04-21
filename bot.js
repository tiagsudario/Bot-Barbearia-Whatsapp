const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const sqlite3 = require('sqlite3').verbose();

const client = new Client({
    authStrategy: new LocalAuth()
});

// Banco de dados
const db = new sqlite3.Database('./agendamentos.db');

db.run(`
CREATE TABLE IF NOT EXISTS agendamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT,
    nome TEXT,
    servico TEXT,
    data TEXT,
    hora TEXT
)
`);

let estados = {}; // controla etapa do usuário

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot online 💈');
});

client.on('message', async msg => {
    const numero = msg.from;
    const texto = msg.body.toLowerCase();

    // MENU
    if (texto === 'menu' || texto === 'oi') {
        estados[numero] = null;
        msg.reply(`💈 Barbearia Style

1 - Serviços
2 - Preços
3 - Agendar
4 - Localização
5 - Atendente`);
    }

    // SERVIÇOS
    else if (texto === '1') {
        msg.reply(`✂️ Corte
🧔 Barba
💈 Combo
🎨 Pigmentação`);
    }

    // PREÇOS
    else if (texto === '2') {
        msg.reply(`Corte: R$30
Barba: R$20
Combo: R$45`);
    }

    // INICIAR AGENDAMENTO
    else if (texto === '3') {
        estados[numero] = { etapa: 'nome' };
        msg.reply('Qual seu nome?');
    }

    // FLUXO DE AGENDAMENTO
    else if (estados[numero]) {
        let estado = estados[numero];

        if (estado.etapa === 'nome') {
            estado.nome = msg.body;
            estado.etapa = 'servico';
            msg.reply('Qual serviço? (corte/barba/combo)');
        }

        else if (estado.etapa === 'servico') {
            estado.servico = msg.body;
            estado.etapa = 'data';
            msg.reply('Qual dia? (ex: 25/04)');
        }

        else if (estado.etapa === 'data') {
            estado.data = msg.body;
            estado.etapa = 'hora';
            msg.reply('Qual horário? (ex: 14:00)');
        }

        else if (estado.etapa === 'hora') {
            estado.hora = msg.body;

            // salvar no banco
            db.run(
                `INSERT INTO agendamentos (numero, nome, servico, data, hora)
                 VALUES (?, ?, ?, ?, ?)`,
                [numero, estado.nome, estado.servico, estado.data, estado.hora]
            );

            msg.reply(`✅ Agendado!

👤 ${estado.nome}
💈 ${estado.servico}
📅 ${estado.data}
⏰ ${estado.hora}`);

            delete estados[numero];
        }
    }

    // LOCALIZAÇÃO
    else if (texto === '4') {
        msg.reply(`📍 Rua Exemplo, 123
https://maps.google.com`);
    }

    // ATENDENTE
    else if (texto === '5') {
        msg.reply('Chamando atendente...');
    }
});

client.initialize();