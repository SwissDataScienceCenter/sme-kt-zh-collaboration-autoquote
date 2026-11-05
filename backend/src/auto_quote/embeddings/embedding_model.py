from abc import ABC, abstractmethod


class EmbeddingModel(ABC):
    """
    Turns texts into embedding vectors, one per text and in the same order. Raises LLMResponseError when the server gives no usable answer.
    """

    @abstractmethod
    async def embed(self, texts: list[str]) -> list[list[float]]:
        pass
