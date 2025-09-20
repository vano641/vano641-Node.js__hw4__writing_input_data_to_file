// Для того, чтобы пользователи хранились постоянно, а не только, когда запущен сервер, необходимо реализовать хранение массива в файле.

// Подсказки:
// — В обработчиках получения данных по пользователю нужно читать файл
// — В обработчиках создания, обновления и удаления нужно файл читать, чтобы убедиться, что пользователь существует, а затем сохранить в файл, когда внесены изменения
// — Не забывайте про JSON.parse() и JSON.stringify() - эти функции помогут вам переводить объект в строку и наоборот.


const express = require('express');
const fs = require('fs'); // для чтения и записи фалов
const path = require('path'); // для работы с путями
const joi = require('joi'); // 
const pathToFile = path.join(__dirname, 'usersList.json');

// создаем приложение
const app = express();

// "проверка(валидация) данных по описанным параметрам"
const userSchema = joi.object({
    // цепочка методов описывающие параметры
    // тип строка, мин.длинна 1 символ, обязательное поле
    firstName: joi.string().min(1).required(),
    secondName: joi.string().min(1).required(),
    age: joi.number().min(0).max(150).required(),
    city: joi.string().min(1)
});

//функция, которая разбирает входящие запросы в объект в формате JSON и делает данные доступными в теле запроса (req.body)
app.use(express.json())

// СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ:
app.post('/users', (req, res) => {
    // результат валидации
    const result = userSchema.validate(req.body);
    // проверка (в Postman если в методе Обновления данных передать "Пустую строку
    // в поле userName, то вывалится ошибка Не соответствия переданных данных параметрам валидации")
    if (result.error) {
        return res.status(404).send({error: result.error.details});
    }

    const usersData = JSON.parse(fs.readFileSync(pathToFile, 'utf-8')); // считываем файл (получаем массив объектов)
    let Id = 0;
    if (usersData.length === 0) {
        Id = 1;    
    } else {
        Id = usersData[usersData.length - 1].Id + 1; // узнаем id последнего элемента в массиве пользователей и увеличиваем на 1
    }
    usersData.push({
        Id: Id,
        // ...req.body - spread оператор, вытаскивает все входящие элементы из запроса, 
        // ниже описано в ручную, лучше ипользовать spread
        firstName: req.body.firstName,
        secondName: req.body.secondName,
        age: req.body.age,
        city: req.body.city
    })
    fs.writeFileSync(pathToFile, JSON.stringify(usersData, null, 2));

    res.send({
        Id: Id,
    });
})

// ПОЛУЧЕНИЕ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ
app.get('/users', (req, res) => {
    const usersData = JSON.parse(fs.readFileSync(pathToFile, 'utf-8'));
    res.send({ users: usersData });
});

// ПОЛУЧЕНИЕ ПОЛЬЗОВАТЕЛЯ ПО Id
app.get('/users/:Id', (req, res) => {
    const usersData = JSON.parse(fs.readFileSync(pathToFile, 'utf-8'));
    const user = usersData.find((user) => user.Id === Number(req.params.Id)); // параметр Id приводим к числу (+req.params.id)

    if (user) {
        res.send({user});
    } else {
        res.status(404);
        res.send({user: null, message: 'Пользователь не найден'});
    }
});

// УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ
app.delete('/users/:Id', (req, res) => {
    const usersData = JSON.parse(fs.readFileSync(pathToFile, 'utf-8')); // сичтываем файл получаем "массив"
    const userDelIndex = usersData.findIndex(user => user.Id === Number(req.params.Id)); // ищем индекс пользователя с введенным Id
    
    if (userDelIndex > -1) {
        usersData.splice(userDelIndex, 1); // удаляем элемент по индексу (цифра 1 это количество элементов для удаления)
        fs.writeFileSync(pathToFile, JSON.stringify(usersData, null, 2));
        res.send({message: 'Пользователь успешно удален!', usersData});
    } else {
        res.status(404);
        res.send({ message: 'Пользователь не найден!' });
    }    
})

// ИЗМЕНЕНИЕ ПОЛЬЗОВАТЕЛЯ
app.put('/users/:Id', (req, res) => {
    const result = userSchema.validate(req.body);
    if (result.error) {
        return res.status(404).send({error: result.error.details});
    }
    const usersData = JSON.parse(fs.readFileSync(pathToFile, 'utf-8'));
    const userUpdate = usersData.find(user => user.Id === Number(req.params.Id)); 
    if (userUpdate) {
            userUpdate.firstName = req.body.firstName;
            userUpdate.secondName = req.body.secondName;
            userUpdate.age = req.body.age;
            userUpdate.city = req.body.city;

            fs.writeFileSync(pathToFile, JSON.stringify(usersData, null, 2));
            res.send({userUpdate});
        } else {
            res.status(404);
            res.send({userUpdate: null, message: 'Пользователь не найден' });
        }
})

app.listen(3000);