from auto_quote.models.extraction import ExtractedField, FieldStatus, ReplyLanguage
from auto_quote.models.follow_up_configuration import FollowUpConfigurationInput
from auto_quote.models.quote import Quote
from auto_quote.utils.extraction_prompt import format_understood_fields


SENDER_PLACEHOLDER = "[Sender name]"

REPLY_INSTRUCTION = "Write a reply to the customer message below."

# The quote is sent as a PDF next to the email, so this stays out of the editable configuration.
QUOTE_ATTACHMENT_INSTRUCTION = "Mention that the quote is attached as a PDF. Do not list its lines or prices."

REPLY_LANGUAGE_INSTRUCTIONS: dict[ReplyLanguage, str] = {
    ReplyLanguage.SAME_AS_MESSAGE: "the same language as the customer message",
    ReplyLanguage.ENGLISH: "English",
    ReplyLanguage.FRENCH: "French",
    ReplyLanguage.GERMAN: "German",
}


def build_follow_up_prompt(
    configuration: FollowUpConfigurationInput,
    message: str,
    extracted_fields: list[ExtractedField],
    missing_fields: list[ExtractedField],
    reply_language: ReplyLanguage,
    quote: Quote | None,
) -> str:
    understood_lines = format_understood_fields(extracted_fields)
    task = (
        _build_missing_information_task(instructions=configuration.missing_information_instructions, missing_fields=missing_fields)
        if missing_fields
        else _build_quote_task(instructions=configuration.quote_instructions, quote=quote)
    )

    return (
        f"{REPLY_INSTRUCTION}\n\n"
        f"{task}\n\n"
        f"What we understood:\n{understood_lines or '- Nothing yet'}\n\n"
        f"Write the reply in {REPLY_LANGUAGE_INSTRUCTIONS[reply_language]}.\n\n"
        f"Customer message:\n<message>\n{message}\n</message>"
    )


def _build_missing_information_task(instructions: str, missing_fields: list[ExtractedField]) -> str:
    missing_lines = "\n".join(_describe_missing_field(field) for field in missing_fields)
    return f"{instructions}\n{missing_lines}"


def _describe_missing_field(field: ExtractedField) -> str:
    if field.status == FieldStatus.PARTIAL:
        return f"- {field.label} (they only said “{field.value}”, we need it precisely)"
    return f"- {field.label}"


def _build_quote_task(instructions: str, quote: Quote | None) -> str:
    quote_summary = f"\nAttached quote: {quote.title}." if quote is not None else ""
    return f"{instructions}\n{QUOTE_ATTACHMENT_INSTRUCTION}{quote_summary}"
