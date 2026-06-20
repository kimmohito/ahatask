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

<!-- This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details. -->
