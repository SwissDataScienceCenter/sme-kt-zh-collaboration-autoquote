class NotFoundError(Exception):
    def __init__(self, entity_name: str, entity_id: str):
        super().__init__(f"{entity_name} {entity_id} not found")


class ConflictError(Exception):
    """
    The request cannot be done in the current state of the data.
    """


class AlreadyExistsError(ConflictError):
    def __init__(self, entity_name: str, entity_id: str):
        super().__init__(f"{entity_name} {entity_id} already exists")


class IndexingInProgressError(ConflictError):
    pass


class MissingQuoteError(ConflictError):
    pass


class ConfigurationFileError(Exception):
    pass


class LLMResponseError(Exception):
    pass
