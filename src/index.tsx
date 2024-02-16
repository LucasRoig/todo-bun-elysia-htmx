import { Elysia, t } from "elysia";
import { html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";

import * as elements from "typed-html";

const app = new Elysia()
  .use(
    staticPlugin({
      assets: "static",
      prefix: "/static",
    })
  )
  .use(html())
  .get("/", ({ html }) =>
    html(
      <BaseHtml>
        <main
          class="flex w-full h-screen justify-center items-center"
          hx-get="/todos"
          hx-trigger="load"
          hx-swap="innerHTML"
        ></main>
      </BaseHtml>
    )
  )
  .post("/clicked", () => <div>I'm from the server</div>)
  .post(
    "/todos",
    ({ body }) => {
      if (body.content.length === 0) {
        throw new Error("Content cannot be empty");
      }
      const newTodo = {
        id: nextID++,
        content: body.content,
        completed: false,
      };
      db.push(newTodo);
      return <TodoItem {...newTodo} />;
    },
    {
      body: t.Object({
        content: t.String(),
      }),
    }
  )
  .post(
    "/todos/toggle/:id",
    ({ params }) => {
      const todo = db.find((todo) => todo.id === params.id);
      if (todo) {
        todo.completed = !todo.completed;
        return <TodoItem {...todo} />;
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
    }
  )
  .delete(
    "/todos/:id",
    ({ params }) => {
      const todo = db.find((todo) => todo.id === params.id);
      if (todo) {
        db.splice(db.indexOf(todo), 1);
      }
    },
    { params: t.Object({ id: t.Numeric() }) }
  )
  .get("/todos", () => <TodoList todos={db} />)
  .listen(3000);
console.log(`Server running at http://localhost:${3000}`);

const BaseHtml = ({ children }: elements.Children) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Elysia</title>
    <link rel="stylesheet" href="/static/css/tailwind.css">
    <script src="https://unpkg.com/htmx.org@1.9.10"></script>
</head>
<body>
    ${children}
</body>
`;

type Todo = {
  id: number;
  content: string;
  completed: boolean;
};

let nextID = 0;
const db: Todo[] = [
  { id: nextID++, content: "Buy milk", completed: false },
  { id: nextID++, content: "Buy eggs", completed: true },
  { id: nextID++, content: "Buy bread", completed: false },
];

const TodoItem = ({ content, completed, id }: Todo) => {
  return (
    <div class="flex flex-row space-x-3">
      <p>{content}</p>
      <input
        type="checkbox"
        checked={completed}
        hx-post={`/todos/toggle/${id}`}
        hx-target="closest div"
        hx-swap="outerHTML"
      />
      <button
        class="text-red-500"
        hx-delete={`/todos/${id}`}
        hx-swap="outerHTML"
        hx-target="closest div"
      >
        X
      </button>
    </div>
  );
};

function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <div>
      {todos.map((todo) => (
        <TodoItem {...todo} />
      ))}
      <TodoForm />
    </div>
  );
}

function TodoForm() {
  return (
    <form
      class="flex flex-row space-x-3"
      hx-post="/todos"
      hx-swap="beforebegin"
    >
      <input type="text" name="content" class="border border-black" />
      <button type="submit">Add</button>
    </form>
  );
}
