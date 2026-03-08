from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import easyocr
import cv2
import numpy as np
import uvicorn

# Inicializa a API
app = FastAPI(
    title="API de Reconhecimento de Placas",
    description="Backend para o desafio técnico de Frontend"
)

# Configuração do CORS (MUITO IMPORTANTE para o React conseguir acessar a API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permite requisições de qualquer origem (ideal para ambiente de teste)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializa o modelo OCR em Português e Inglês
# Nota: gpu=False garante que rode em qualquer máquina de teste, mesmo sem placa de vídeo dedicada.
print("Carregando o modelo de Visao Computacional... (Pode levar alguns segundos na primeira vez)")
reader = easyocr.Reader(['pt', 'en'], gpu=False, verbose=False)

@app.post("/api/recognize-plate")
async def recognize_plate(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="O arquivo enviado nao e uma imagem valida. Envie JPG ou PNG.")

    try:
        # 2. Lê a imagem enviada para a memória
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="A imagem esta corrompida ou nao pode ser lida.")

        # 3. Executa a leitura OCR na imagem
        # detail=1 retorna a bounding box, o texto e a probabilidade
        results = reader.readtext(img, detail=1)
        # 4. Formata a resposta
        placas_encontradas = []
        for (bbox, text, prob) in results:
            # Filtro básico: ignora textos muito curtos que provavelmente são ruídos
            if len(text.strip()) >= 4:
                placas_encontradas.append({
                    "placa": text.strip().upper(),
                    "confianca": round(prob * 100, 2)
                })

        return {
            "status": "sucesso",
            "mensagem": f"{len(placas_encontradas)} placa(s)/texto(s) detectado(s).",
            "dados": placas_encontradas
        }

    except Exception as e:
        # Retorna erro 500 caso algo dê errado no processamento do OpenCV/EasyOCR
        raise HTTPException(status_code=500, detail=f"Erro interno ao processar a imagem: {str(e)}")

if __name__ == "__main__":
    # Inicia o servidor na porta 8000
    print("Servidor rodando em http://localhost:8000")
    uvicorn.run("backend:app", host="0.0.0.0", port=8000, reload=True)