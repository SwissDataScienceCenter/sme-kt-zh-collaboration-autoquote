import json
from pathlib import Path

from loguru import logger
from pydantic import BaseModel

from auto_quote.errors import NotFoundError
from auto_quote.utils.ids import generate_id
from auto_quote.utils.time import get_current_timestamp


class JSONFileStore[RecordT: BaseModel]:
    """
    Keeps the records of one entity in memory, keyed by id, and rewrites the whole JSON file on every change.
    """

    def __init__(self, json_file_path: Path, record_type: type[RecordT], entity_name: str):
        self.json_file_path = json_file_path
        self.record_type = record_type
        self.entity_name = entity_name
        self.records = self._load()

    def get_records(self) -> list[RecordT]:
        return list(self.records.values())

    def get_record_by_id(self, record_id: str) -> RecordT:
        record = self.records.get(record_id)
        if record is None:
            raise NotFoundError(entity_name=self.entity_name, entity_id=record_id)
        return record

    def save_record(self, record_id: str, record: RecordT) -> None:
        self.records[record_id] = record
        self._save()

    def delete_records(self, record_ids: list[str]) -> None:
        for record_id in record_ids:
            self.records.pop(record_id, None)
        self._save()

    def _load(self) -> dict[str, RecordT]:
        if not self.json_file_path.exists():
            return {}
        try:
            raw_records = json.loads(self.json_file_path.read_text(encoding="utf-8"))
            return {record_id: self.record_type.model_validate(raw_record) for record_id, raw_record in raw_records.items()}
        except Exception as e:
            logger.error(f"Error loading {self.entity_name} records from {self.json_file_path}: {e}")
            raise

    def _save(self) -> None:
        raw_records = {record_id: record.model_dump(mode="json") for record_id, record in self.records.items()}
        # Write then rename, so a crash mid-write never leaves a truncated file behind.
        temporary_path = self.json_file_path.with_suffix(".tmp")
        try:
            temporary_path.write_text(json.dumps(raw_records, indent=4, ensure_ascii=False), encoding="utf-8")
            temporary_path.replace(self.json_file_path)
        except OSError as e:
            logger.error(f"Error saving {self.entity_name} records to {self.json_file_path}: {e}")
            raise


class JSONFileSingleRecordStore[RecordT: BaseModel, InputT: BaseModel]:
    """
    Keeps a single record, created from the default input the first time it is read. The file keeps the id-keyed layout of JSONFileStore.
    The record type must accept the input fields plus id, create_timestamp and update_timestamp.
    """

    def __init__(self, json_file_path: Path, record_type: type[RecordT], entity_name: str, default_input: InputT):
        self.store = JSONFileStore(json_file_path=json_file_path, record_type=record_type, entity_name=entity_name)
        self.record_type = record_type
        self.default_input = default_input

    def get_record(self) -> RecordT:
        records = self.store.get_records()
        if records:
            return records[0]
        return self._save_record(record_input=self.default_input, record_id=generate_id(), create_timestamp=get_current_timestamp())

    def update_record(self, record_input: InputT) -> RecordT:
        record = self.get_record()
        return self._save_record(record_input=record_input, record_id=record.id, create_timestamp=record.create_timestamp)

    def _save_record(self, record_input: InputT, record_id: str, create_timestamp: int) -> RecordT:
        record = self.record_type(
            **record_input.model_dump(), id=record_id, create_timestamp=create_timestamp, update_timestamp=get_current_timestamp()
        )
        self.store.save_record(record_id=record_id, record=record)
        return record
