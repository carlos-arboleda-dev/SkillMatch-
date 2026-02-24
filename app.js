const express = require('express');
const app = express();


app.use(express.urlencoded({extended:false}));
app.use(express.json());


const dotenv = require('dotenv');
dotenv.config({path: './env/.env'});




app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));


app.set('view engine', 'ejs');


const bcryptjs = require('bcryptjs');


const session = require('express-session');
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));


const connection = require('./database/db');


app.get('/login', (req, res)=>{
    res.render('login');
})


app.get('/register', (req, res)=>{
    res.render('register');
})


// app.post('/register', async(req, res)=>{
//     const user = req.body.username;
//     const name = req.body.fullname;
//     const rol = req.body.rol;
//     const pass = req.body.password;
//     let passwordHaas = await bcryptjs.hash(pass, 8);
//     connection.query('INSERT INTO users SET ?', {user:user, name:name, rol:rol, pass:passwordHaas}, async(error, results)=>{
//         if(error){
//             console.log(error);
//         }else{
//             res.render('register', {
//                 alert: true,
//                 alertTitle: "Registration",
//                 alertMessage: "¡Registro exitoso!",
//                 alertIcon: 'success',
//                 showConfirmButton: false,
//                 timer: 1500,
//                 ruta: ''
//             });
            
            
//         }
//     })
// })

app.post('/register', async (req, res) => {
    try {
        const user = req.body.username;
        const name = req.body.fullname;
        const rol = req.body.rol;
        const pass = req.body.password;

        const passwordHash = await bcryptjs.hash(pass, 8);

        await connection.query(
            'INSERT INTO users ("user", name, rol, pass) VALUES ($1, $2, $3, $4)',
            [user, name, rol, passwordHash]
        );

        res.render('register', {
            alert: true,
            alertTitle: "Registration",
            alertMessage: "¡Registro exitoso!",
            alertIcon: 'success',
            showConfirmButton: false,
            timer: 1500,
            ruta: ''
        });

    } catch (error) {
        console.log(error);
    }
});


// app.post('/auth', async (req, res)=> {
//     const user = req.body.user;
//     const pass = req.body.pass;    
//     let passwordHaas = await bcryptjs.hash(pass, 8);
//     if (user && pass) {
//         connection.query('SELECT * FROM users WHERE user = ?', [user], async (error, results, fields)=> {
//             if( results.length == 0 || !(await bcryptjs.compare(pass, results[0].pass)) ) {    
//                 res.render('login', {
//                         alert: true,
//                         alertTitle: "Error",
//                         alertMessage: "USUARIO y/o PASSWORD incorrectas",
//                         alertIcon:'error',
//                         showConfirmButton: true,
//                         timer: false,
//                         ruta: 'login'    
//                     });
       
//             } else {        
//                 //creamos una var de session y le asignamos true si INICIO SESSION      
//                 req.session.loggedin = true;                
//                 req.session.name = results[0].name;
//                 res.render('login', {
//                     alert: true,
//                     alertTitle: "Conexión exitosa",
//                     alertMessage: "¡LOGIN CORRECTO!",
//                     alertIcon:'success',
//                     showConfirmButton: false,
//                     timer: 1500,
//                     ruta: ''
//                 });                
//             }          
//             res.end();
//         });
//     } else {    
//         res.render('login', {
//             alert: true,
//             alertTitle: "Advertencia",
//             alertMessage: "Por favor ingrese un usuario y password valido",
//             alertIcon:'warning',
//             showConfirmButton: true,
//             timer: false,
//             ruta: 'login'
//     });
// }
// })


app.post('/auth', async (req, res) => {
    try {
        const user = req.body.user;
        const pass = req.body.pass;

        if (!user || !pass) {
            return res.render('login', {
                alert: true,
                alertTitle: "Advertencia",
                alertMessage: "Por favor ingrese usuario y password",
                alertIcon: 'warning',
                showConfirmButton: true,
                timer: false,
                ruta: 'login'
            });
        }

        const result = await connection.query(
            'SELECT * FROM users WHERE "user" = $1',
            [user]
        );

        if (result.rows.length === 0 ||
            !(await bcryptjs.compare(pass, result.rows[0].pass))) {

            return res.render('login', {
                alert: true,
                alertTitle: "Error",
                alertMessage: "USUARIO y/o PASSWORD incorrectas",
                alertIcon: 'error',
                showConfirmButton: true,
                timer: false,
                ruta: 'login'
            });
        }

        req.session.loggedin = true;
        req.session.name = result.rows[0].name;

        res.render('login', {
            alert: true,
            alertTitle: "Conexión exitosa",
            alertMessage: "¡LOGIN CORRECTO!",
            alertIcon: 'success',
            showConfirmButton: false,
            timer: 1500,
            ruta: ''
        });

    } catch (error) {
        console.log(error);
    }
});


app.get('/', (req, res)=> {
    if (req.session.loggedin) {
        res.render('index',{
            login: true,
            name: req.session.name          
        });    
    } else {
        res.render('index',{
            login:false,
            name:'Debe iniciar sesión'          
        });            
    }
    res.end();
});




//función para limpiar la caché luego del logout
app.use(function(req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});


 //Logout
//Destruye la sesión.
app.get('/logout', function (req, res) {
    req.session.destroy(() => {
      res.redirect('/') // siempre se ejecutará después de que se destruya la sesión
    })
});




app.listen(3000, (req, res)=>{
    console.log('SERVER RUNNING IN http://localhost:3000');
})
