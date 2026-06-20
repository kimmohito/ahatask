Core Requiremen ts

## Data Model

- An Organization has many Users, Projects, and Tasks. 
- A Project belongs to one organization and has many tasks. 
- A Task belongs to a project, has a title, description, status, an optional assignee, and a created/updated timestamp. 

## Auth & roles

- Users log in and belong to exactly one organization. 
- Two roles: Admin (manage users and projects), Member (create/edit tasks). 
- Enforce what each role can and cannot do. 

## API

- CRUD for projects and tasks.
- A task list endpoint that supports pagination, filtering (by status, assignee), and sorting — assume a project could have thousands of tasks. 

## Frontend

- Login screen. 
- A project view showing its tasks in a table or board, with the filtering/sorting/pagination above. 
- Create and edit tasks without full-page reloads. 
- Handle loading, empty, and error states; reflect the user's role in the UI. 

## Activity Tracking

- Record significant task-related events. 
- Activity history should be viewable for auditing purposes.

## Dashboard

Provide a dashboard that gives an organization visibility into its work, such as: 
- Workload overview 
- Task status distribution
- Team activity summary

The dashboard must only contain information from the current organization.

Constraints (these matter) 

- A user from Organization A must never be able to read or modify Organization B's data, through any endpoint. 
- The task list must stay responsive with thousands of tasks per project. 
- The UI must behave sensibly when the API is slow or returns an error. 
- Role permissions must be actually enforced, not just visually hidden. 
