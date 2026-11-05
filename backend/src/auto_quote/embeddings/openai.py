from loguru import logger
from openai import AsyncOpenAI, OpenAIError

from auto_quote.embeddings.embedding_model import EmbeddingModel
from auto_quote.errors import LLMResponseError


class OpenAIEmbeddingModel(EmbeddingModel):
    """Works with any server implementing the OpenAI embeddings API (OpenAI, Ollama, …) by changing the base url."""

    def __init__(self, base_url: str | None, api_key: str, model: str):
        self.client = AsyncOpenAI(base_url=base_url, api_key=api_key)
        self.model = model

    async def embed(self, texts: list[str]) -> list[list[float]]:
        try:
            response = await self.client.embeddings.create(model=self.model, input=texts)
        except OpenAIError as e:
            logger.error(f"Error computing embeddings with {self.model}: {e}")
            raise LLMResponseError(f"Model {self.model} could not compute embeddings") from e
        return [item.embedding for item in sorted(response.data, key=lambda item: item.index)]
