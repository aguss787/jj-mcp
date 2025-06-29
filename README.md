# Jujutsu MCP Server

A Model Context Protocol (MCP) server for interacting with Jujutsu version control.

## Available Tools

This server exposes several tools to manage your Jujutsu repository, including:

- `jj_status`: Shows the current state of the working copy and the repo.
- `jj_log`: Shows the commit history.
- `jj_commit`: Creates a new commit.
- `jj_desc`: Amends the description of the specified commit.
- `jj_bookmark`: Manage bookmarks.
- `jj_bookmark_set`: Create or update a bookmark to point to a certain commit.
- `jj_bookmark_move`: Move existing bookmarks to a target revision.
- `jj_diff`: Shows the diff of the specified revision.
- `jj_abandon`: Abandons the specified revision.
- `jj_squash`: Moves changes from a revision into another revision.
- `jj_rebase`: Moves revisions to different parent(s).
- `jj_git_push`: Pushes to a Git remote.
- `jj_git_fetch`: Fetch from a Git remote.
- `jj_git_remote_add`: Add a Git remote.
- `jj_git_remote_list`: List Git remotes.
- `jj_git_remote_remove`: Remove a Git remote and forget its bookmarks.
- `jj_git_remote_rename`: Rename a Git remote.
- `jj_git_remote_set_url`: Set the URL of a Git remote.

## Available Resources

- `jujutsu://info`: Provides general information about the Jujutsu repository.
