const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializedbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running...");
    });
  } catch (e) {
    console.log(e.message);
  }
};

initializedbAndServer();

//api 1
const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasPriorityandStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", status, priority } = request.query;
  switch (true) {
    case hasPriorityandStatus(request.query):
      getTodosQuery = `
            select * from todo
            where todo like "%${search_q}%"
            and priority="${priority}" 
           and status="${status}" ;
            `;
      break;
    case hasStatus(request.query):
      getTodosQuery = `
            select * from todo
            where status="${status}" and todo like "%${search_q}%";
            `;
      break;
    case hasPriority(request.query):
      getTodosQuery = `
            select * from todo
            where priority="${priority}" and todo like "%${search_q}%";
            `;
      break;

    default:
      getTodosQuery = `
            select * from todo
            where  todo like "%${search_q}%";
            `;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});
//api 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoQuery = `
    select * from todo
    where id=${todoId};
    `;
  const todoResponse = await db.get(todoQuery);
  response.send(todoResponse);
});
//api 3
app.post("/todos/", async (request, response) => {
  const { id, todo, status, priority } = request.body;
  const todoQuery = `
    insert into todo
    values(${id},"${todo}","${priority}","${status}");
    `;
  await db.run(todoQuery);
  response.send("Todo Successfully Added");
});
//api 4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodo = `select * from todo where id=${todoId};`;
  const previousResponse = await db.get(previousTodo);
  const {
    todo = previousResponse.todo,
    priority = previousResponse.priority,
    status = previousResponse.status,
  } = request.body;
  const updateQuery = `
    update todo
    set todo="${todo}",
        status="${status}",
        priority="${priority}"
    where id=${todoId};
    `;
  await db.run(updateQuery);
  response.send(`${updateColumn} Updated`);
});
//api 5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const delQuery = `
    delete from todo
    where id=${todoId};
    `;
  await db.run(delQuery);
  response.send("Todo Deleted");
});
module.exports = app;
