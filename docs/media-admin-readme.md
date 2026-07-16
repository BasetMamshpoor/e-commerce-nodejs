# Media Admin Management — Frontend Notes

## Overview

This update expands media administration for admin users so they can browse uploaded assets by entity and date-based folder, inspect metadata, update media records, and remove date-based folders safely.

## New admin capabilities

- Browse all media records with filters: `entityType`, `type`, `search`, `year`, `month`.
- List date-based folders under the upload root with `GET /api/v1/media/folders`.
- Remove a specific date-based folder via `DELETE /api/v1/media/folders/:entityType/:year/:month`.
- Force-delete a media record and all of its usages via `DELETE /api/v1/media/:id/force-delete`.
- Update metadata on a media record via `PATCH /api/v1/media/:id`.
- Download an individual file via `GET /api/v1/media/:id/download`.
- View media usage via `GET /api/v1/media/:id/usage`.

## Important safety rules

- The root media folders such as `blog`, `brands`, `tickets`, etc. are not removed by the folder-delete endpoint.
- Only date-based folders in the format `entityType/YYYY/MM` are eligible for deletion.
- Deleting a folder removes database media rows whose `filePath` starts with that prefix and then removes the folder from disk.

## Example requests

### List folders

```http
GET /api/v1/media/folders?entityType=blog&year=2026&month=07
Authorization: Bearer <admin-token>
```

### Delete a date-based folder

```http
DELETE /api/v1/media/folders/blog/2026/07
Authorization: Bearer <admin-token>
```

### Force-delete a media record and its usages

```http
DELETE /api/v1/media/42/force-delete
Authorization: Bearer <admin-token>
```

### List media items under a folder

```http
GET /api/v1/media?entityType=blog&year=2026&month=07
Authorization: Bearer <admin-token>
```

## Response shape for folder listing

```json
[
  {
    "entityType": "blog",
    "year": "2026",
    "month": "07",
    "path": "blog/2026/07",
    "fileCount": 5,
    "totalSize": 123456
  }
]
```

## Notes for frontend implementation

- Use `entityType` for the main grouping and `year`/`month` for the date partitioning.
- The response of `GET /api/v1/media` still returns the regular paginated media list.
- The admin UI should not expose the deletion endpoint for the root entity directories, only for the date-based subfolders.
