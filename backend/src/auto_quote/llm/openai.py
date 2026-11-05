import json
from typing import Any

from loguru import logger
from openai import AsyncOpenAI, OpenAIError, omit
from openai.types.responses import Response, ResponseFunctionToolCall

from auto_quote.errors import LLMResponseError
from auto_quote.llm.llm import LLM, LLMMessage


class OpenAILLM(LLM):
    """Works with any server implementing the OpenAI Responses API (OpenAI, Ollama, …) by changing the base url."""

    def __init__(self, base_url: str | None, api_key: str, model: str):
        self.client = AsyncOpenAI(base_url=base_url, api_key=api_key)
        self.model = model

    async def generate_text(self, messages: list[LLMMessage]) -> str:
        response = await self._create_response(messages=messages, text_config=None)
        return self._get_output_text(response)

    async def generate_json(self, messages: list[LLMMessage], json_schema: dict[str, Any], schema_name: str) -> dict[str, Any]:
        text_config = {
            "format": {"type": "json_schema", "name": schema_name, "schema": json_schema, "strict": True},
        }
        response = await self._create_response(messages=messages, text_config=text_config)
        output_text = self._get_output_text(response)
        try:
            return json.loads(output_text)
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing JSON returned by {self.model} for {schema_name}: {e}")
            raise LLMResponseError(f"Model {self.model} returned invalid JSON for {schema_name}") from e

    async def call_tool(self, messages: list[LLMMessage], tool: dict[str, Any]) -> dict[str, Any]:
        tool_name = tool["name"]
        response = await self._create_response(
            messages=messages, text_config=None, tools=[tool], tool_choice={"type": "function", "name": tool_name}
        )
        tool_call = next(
            (item for item in response.output if isinstance(item, ResponseFunctionToolCall) and item.name == tool_name),
            None,
        )
        if tool_call is None:
            raise LLMResponseError(f"Model {self.model} did not call {tool_name}")
        try:
            return json.loads(tool_call.arguments)
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing the arguments returned by {self.model} for {tool_name}: {e}")
            raise LLMResponseError(f"Model {self.model} returned invalid arguments for {tool_name}") from e

    async def _create_response(
        self,
        messages: list[LLMMessage],
        text_config: dict[str, Any] | None,
        tools: list[dict[str, Any]] | None = None,
        tool_choice: dict[str, Any] | None = None,
    ) -> Response:
        input_messages = [{"role": message.role.value, "content": message.content} for message in messages]
        try:
            return await self.client.responses.create(
                model=self.model,
                input=input_messages,
                text=text_config if text_config is not None else omit,
                tools=tools if tools is not None else omit,
                tool_choice=tool_choice if tool_choice is not None else omit,
            )
        except OpenAIError as e:
            logger.error(f"Error generating a response with {self.model}: {e}")
            raise LLMResponseError(f"Model {self.model} could not generate a response") from e

    def _get_output_text(self, response: Response) -> str:
        if not response.output_text:
            raise LLMResponseError(f"Model {self.model} returned an empty response")
        return response.output_text
