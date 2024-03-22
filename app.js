const express = require('express')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')
const dateFormat = require('date-fns/format')
const dateValid = require('date-fns/isValid')
const addDays = require('date-fns/addDays')
const dateMatch = require('date-fns/isMatch')
const dbPath = path.join(__dirname, 'todoApplication.db')
const app = express()
app.use(express.json())
let db = null
const initDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running On 3000 Port')
    })
  } catch (e) {
    console.log(`DB Error:${e.message}`)
    process.exit(1)
  }
}
initDbAndServer()

const hasPriorityAndStatus = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}
const hasPriority = requestQuery => {
  return requestQuery.priority !== undefined
}
const hasStatus = requestQuery => {
  return requestQuery.status !== undefined
}
const hasCategoryAndStatus = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}
const hasCategoryAndPriority = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}
const hasSearch = requestQuery => {
  return requestQuery.search_q !== undefined
}
const hasCategory = requestQuery => {
  return requestQuery.category !== undefined
}

const outputResult = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  }
}

app.get('/todos/', async (request, response) => {
  const {status, priority, category, search_q = ''} = request.query
  let data = null
  let getTodoQuery = ''

  switch (true) {
    case hasPriorityAndStatus(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGESS' ||
          status === 'DONE'
        ) {
          getTodoQuery = `SELECT * FROM todo
          WHERE status="${status}" AND priority="${priority}"`
          data = await db.all(getTodoQuery)
          response.send(data.map(eachItem => outputResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasCategoryAndStatus(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGESS' ||
          status === 'DONE'
        ) {
          getTodoQuery = `
        SELECT *
        FROM todo
        WHERE status="${status}" AND category="${category}"
        `
          data = await db.all(getTodoQuery)
          response.send(data.map(eachItem => outputResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasCategoryAndPriority(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodoQuery = `
        SELECT *
        FROM todo
        WHERE priority="${priority}" AND category="${category}"
        `
          data = await db.all(getTodoQuery)
          response.send(data.map(eachItem => outputResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasPriority(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodoQuery = `
        SELECT *
        FROM todo
        WHERE priority="${priority}" 
        `
        data = await db.all(getTodoQuery)
        response.send(data.map(eachItem => outputResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasStatus(request.query):
      if (status === 'TO DO' || status === 'IN PROGESS' || status === 'DONE') {
        getTodoQuery = `
        SELECT *
        FROM todo
        WHERE status="${status}" 
        `
        data = await db.all(getTodoQuery)
        response.send(data.map(eachItem => outputResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case hasSearch(request.query):
      getTodoQuery = `SELECT *
       FROM todo
      WHERE todo LIKE "%${search_q}%"`
      data = await db.all(getTodoQuery)
      response.send(data.map(eachItem => outputResult(eachItem)))
      break
    case hasCategory(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodoQuery = `SELECT * FROM todo
        WHERE category="${category}" `
        data = await db.all(getTodoQuery)
        response.send(data.map(eachItem => outputResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }

      break
    default:
      getTodoQuery = `SELECT * FROM todo`
      data = await db.all(getTodoQuery)
      response.send(data.map(eachItem => outputResult(eachItem)))
  }
})

//API 2

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoId = `SELECT * FROM todo
  WHERE id="${todoId}"`
  const data = await db.get(getTodoId)
  response.send(outputResult(data))
})

//API 3

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  //console.log(isMatch(date, 'yyyy-MM-dd'))
  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date, 'yyyy-MM-dd'))
    //console.log(newDate)
    const requestQuery = `SELECT * FROM todo
    WHERE due_date="${newDate}"`
    const result = db.all(requestQuery)
    response.send(result.map(eachItem => outputResult(eachItem)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

//API 4

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
    if (status === 'TO DO' || status === 'IN PROGESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const newDate = format(new Date(dueDate, 'yyyy-MM-dd'))
          const postMethod = `
          INSERT INTO todo(id,todo,category,priority,status,due_date)
          VALUES( ${id}, "${todo}", "${category}", "${priority}", "${status}", "${newDate}")`
          await db.run(postMethod)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})

//API 5

app.put('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body
  let updateColumn = ''
  const previousQuery = `SELECT * FROM todo
  WHERE id="${todoId}"`
  const result = await db.get(previousQuery)
  const {
    todo = result.todo,
    priority = result.priority,
    status = result.status,
    category = result.category,
    dueDate = result.dueDate,
  } = request.body
  let updateTodoQuery
  switch (true) {
    case requestBody.status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGESS' || status === 'DONE') {
        updateTodoQuery = `
      UPDATE todo SET todo="${todo}", priority="${priority}", status="${status}",category="${category}",due_date="${dueDate}"
      WHERE id="${todoId}"`
        await db.run(updateTodoQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case requestBody.priority !== undefined:
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        updateTodoQuery = `
      UPDATE todo SET todo="${todo}",priority="${priority}",status="${status}",category="${category}",due_date="${dueDate}"
      WHERE id="${todoId}"`
        await db.run(updateTodoQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case requestBody.todo !== undefined:
      updateTodoQuery = `
      UPDATE todo SET todo="${todo}",priority="${priority}",status="${status}",category="${category}",due_date="${dueDate}"
      WHERE id="${todoId}"`
      await db.run(updateTodoQuery)
      response.send('Todo Updated')
      break
    case requestBody.category !== undefined:
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        updateTodoQuery = `
      UPDATE todo SET todo="${todo}",priority="${priority}",status="${status}",category="${category}",due_date="${dueDate}"
      WHERE id="${todoId}"`
        await db.run(updateTodoQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const newDate = format(new Date(dueDate, 'yyyy-MM-dd'))
        updateTodoQuery = `
          UPDATE todo SET todo="${todo}",priority="${priority}",status="${status}",category="${category}",due_date="${dueDate}"
          WHERE id="${todoId}"`
        await db.run(updateTodoQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
  }
})

// API 6

app.delete('/todos/:todoId', (request, response) => {
  const {todoId} = request.params
  const deleteTodo = `
  DELETE FROM todo WHERE id="${todoId}"`
  db.run(deleteTodo)
  response.send('Todo Deleted')
})

module.exports = app
