# Dashboard – Leitura de Placas

Front-end em **React** (Vite) para o desafio técnico de integração com a API de reconhecimento de placas por visão computacional.

---

## Como rodar o projeto

### 1. Instalar as dependências

No terminal, na pasta do projeto:

```bash
npm install
```

### 2. Subir o servidor de desenvolvimento

```bash
npm run dev
```

O app abre no navegador (em geral em **http://localhost:5173**).

### 3. (Opcional) Build para produção

```bash
npm run build
```

Os arquivos gerados ficam na pasta `dist/`. Para visualizar a build localmente:

```bash
npm run preview
```

---

## O que o projeto possui

### Funcionalidades principais

- **Upload de imagem** – Área para clicar ou arrastar e soltar uma foto do veículo (com placa visível). Aceita formatos de imagem (JPG, PNG, etc.).
- **Envio para a API** – Botão **"Enviar para análise"** que envia a imagem em `POST` para o endpoint da API (FormData com a chave `file`).
- **Painel de resultado** – Exibe a **placa lida** e o **percentual de confiança** retornados pela API.
- **Preview da imagem** – A imagem selecionada é exibida na tela antes e depois do envio (ao lado do resultado).
- **Loading** – Mensagem e animação de “Processando...” enquanto a API processa a imagem.
- **Tratamento de erros** – Mensagens claras quando a API está indisponível, há erro de rede ou a resposta é inválida.

### Diferenciais

- **Responsividade** – Layout adaptado para celular e tablet (breakpoint em 600px). Upload, resultado, tabela e gráfico se ajustam à largura da tela.
- **Histórico da sessão** – As últimas leituras da sessão atual são guardadas em memória e exibidas em uma **tabela** com: número da leitura, placa, confiança (%) e horário (até 20 itens).
- **Gráfico de confiança** – Uso da biblioteca **Recharts** para um gráfico de barras com a confiança de cada leitura e exibição da **média de confiança** das últimas leituras.

### Interface

- Tema escuro/claro conforme preferência do sistema.
- **Footer fixo** na parte inferior da tela com crédito (“Desenvolvido por João Roberto”) e ícones de contato: LinkedIn, WhatsApp e e-mail (com cópia do e-mail ao clicar).

---

## Tecnologias

- **React** + **Vite**
- **Recharts** (gráficos)
- CSS com variáveis e media queries para responsividade

---

## Integração com a API

O front espera a API em **http://localhost:8000** (endpoint `POST /api/recognize-plate` com FormData, chave `file`). Para usar outra URL, crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://endereco-da-sua-api
```

O backend (Python/FastAPI) deve estar rodando para o envio e exibição dos resultados funcionarem.

---

## Contato

**Desenvolvido por João Roberto**

- **LinkedIn:** [linkedin.com/in/joão-roberto-de-oliveira-felix-780471296](https://www.linkedin.com/in/joão-roberto-de-oliveira-felix-780471296)
- **WhatsApp:** [(85) 99198-4682](https://wa.me/5585991984682?text=Olá%2C%20vim%20pelo%20seu%20portfolio!)
- **E-mail:** [joao.robertodof@gmail.com](mailto:joao.robertodof@gmail.com)
