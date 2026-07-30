package com.gametracker.javaservice.model;

public record BacklogEntrySnapshot(
		String id,
		int gameId,
		String gameName,
		String coverUrl,
		Integer releaseYear,
		String status,
		Integer rating,
		String createdAt,
		String updatedAt) {
}
