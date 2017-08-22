var fs = require("fs");
var express = require("express");
var cors = require('cors');
var mysql = require('mysql');
var app = express();

app.use(cors()); 

var config = require("./ConfigDB.js");
var port = config.ws_port;
var server = app.listen(port, function () {
		console.log("******************************");
		console.log("Data accesso: "+Date());
});



app.use(function (req, res, next) { //consente cross domain
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});



app.get('/search/:data', function(req, res){ //funziona di prova connessione tra client-server-database
    var param=req.params.data;
    if(param.length == 0){
        eseguiQuery(res, 'SELECT idAtleta, Nome, Cognome FROM Atleti;');
    } 
    else{
        eseguiQuery(res, "SELECT idAtleta, Nome, Cognome FROM Atleti WHERE Nome LIKE '%"+ param+"%' || Cognome LIKE '%"+ param+"%';");
    }
    
});

app.get('/tuttiAtleti', function(req,res){
    eseguiQuery(res, 'select * from CaratteristicheAtleti;');
})

app.get('/tutteSocieta', function(req,res){
    eseguiQuery(res,'select * from SquadreCountPartecipanti;');
})

app.get('/EliminaAtleta/:idAtleta', function(req, res){
    eseguiQuery(res, 'delete from Atleti where idAtleta=?;',[req.params.idAtleta]);
})

app.get('/ModificaAtleta/:idAtleta', function(req, res){
    eseguiQuery(res, 'select * from Atleti where idAtleta=?;',[req.params.idAtleta]);
})
app.get('/ListaPesi/', function(req,res){
    eseguiQuery(res, 'select * from CategoriePeso;');
})

app.get('/ListaCategorie/', function(req,res){
    eseguiQuery(res, 'select * from CategoriaEtà;');
})

app.get('/ListaTatami/', function(req, res){
    eseguiQuery(res, 'select * from Tatami;');
})

app.get('/InserisciAtleta/:nome/:cognome/:peso/:sesso/:annoNascita/:fkSquadre', function(req,res){
    var Nome=req.params.nome;
    var Cognome=req.params.cognome;
    var Peso=req.params.peso;
    var Sesso=req.params.sesso;
    var AnnoNascita=req.params.annoNascita;
    var FkSquadre=req.params.fkSquadre;
    console.log(Nome, Cognome, Peso, Sesso, AnnoNascita, FkSquadre);
    eseguiQuery(res,'INSERT INTO Atleti(Nome,Cognome,Peso,Sesso,AnnoNascita,FkSquadre) values(?,?,?,?,?,?);',[Nome, Cognome, Peso, Sesso, AnnoNascita, FkSquadre]);
    
})



app.get('/tuttiIncontri', function(req,res){
    eseguiQuery(res, 'select a1.Nome as NomePrimoAtleta, a1.Cognome as CognomePrimoAtleta, a2.Nome as NomeSecondoAtleta, a2.Cognome as CognomeSecondoAtleta from Incontri join Atleti as a1 on Incontri.FkAtleta1 = a1.idAtleta join Atleti as a2 on Incontri.FkAtleta2 = a2.idAtleta;');
})

app.get('/login/:pwd', function(req,res){
    var hashPassword = req.params.pwd;
    // 123
    const pwdResult = "9a0a82f0c0cf31470d7affede3406cc9aa8410671520b727044eda15b4c25532a9b5cd8aaf9cec4919d76255b6bfb00f";
    // 456
    const pwdInsert = "714b7ac92749929c1902ae7a8497bf8da3fb421a3ec4311332053cc43f0994be9b6844f5b34ebd10d6801a1ea2482918";
    // 123456
    const pwdAdmin = "0a989ebc4a77b56a6e2bb7b19d995d185ce44090c13e2984b7ecc6d446d4b61ea9991b76a4c2f04b1b4d244841449454";
    
    // 0 = InseritoreAtleti, 1 = InseritoreRisultati, 2 = Amministratore, 3 = Non loggato
    if(hashPassword == pwdInsert){
        res.send("0");
    }else if(hashPassword == pwdResult){
        res.send("1");
    }
    else if(hashPassword == pwdAdmin){
        res.send("2");
    }
    else
        res.send("3");
    
})

function eseguiQuery(res, sQuery, aParam) { //esegue query che passi come parametro
    // for debug
    outMessage('Request: SQL -- ' + sQuery);
    connection = mysql.createConnection(config.connection);
    connection.connect();
    connection.query(sQuery, aParam, function (err, rows, fields) {
        if (!err) {
            res.json(rows);
            console.log(rows);

        }
        else {
            outMessage(' >>>>> ' + err)
            res.json('{}');
        }
    });
    connection.end();
}

function outMessage(msg) {
	//per log dei messaggi
    console.log(' ----- ' + new Date().toLocaleString() + ' ----- ');
    console.log(msg);
    console.log('');
}

app.get('/VisualizzaIncontri/:Sesso/:Categorie/:Peso', function(req,res){
        console.log(req.params.Sesso);
       eseguiQuery (res,'select  CONCAT(a.Nome, " ", a.Cognome) as Primoatleta, CONCAT(b.Nome," ", b.Cognome) as Secondoatleta, Incontri.Turno, idIncontri from Incontri join Atleti as a on a.idAtleta = Incontri.FkAtleta1 join Atleti as b on b.idAtleta = Incontri.FkAtleta2 where  Incontri.Sesso=? && Incontri.FkCategoriEta=? && Incontri.FkCategoriePeso=?;',[ req.params.Sesso, req.params.Categorie, req.params.Peso]);
})

app.get('/MostraAvversari/:idIncontro', function(req,res){
    eseguiQuery(res, 'select  CONCAT(a.Nome, " ", a.Cognome) as Primoatleta, CONCAT(b.Nome," ", b.Cognome) as Secondoatleta, idIncontri, FkAtleta1, FkAtleta2 from Incontri join Atleti as a on a.idAtleta = Incontri.FkAtleta1 join Atleti as b on b.idAtleta = Incontri.FkAtleta2 where idIncontri = ?;',[req.params.idIncontro]);
})

app.post('/InserisciVincitoreDb/:ValoreVincitore/:idIncontri', function(req,res){
   eseguiQuery(res, 'Update Incontri set Vincente = ? where idIncontri = ?;', [req.params.ValoreVincitore, req.params.idIncontri]);     
})

app.get('ModificaAtleta/:id', function(req,res){
    eseguiQuery(res, 'select * from Atleti where idAtleta = ?;', [req.params.id]);
})

app.get('/InserisciLaModifica/:id/:nome/:cognome/:peso/:sesso/:annoNascita/:fkSquadre', function(req,res){ 
    eseguiQuery(res, 'Update Atleti set Nome = ?, Cognome = ?, Peso = ?, AnnoNascita = ?, Sesso = ?, FkSquadre=? where idAtleta = ?;', [req.params.nome, req.params.cognome,req.params.peso, req.params.annoNascita, req.params.sesso,req.params.fkSquadre, req.params.id]);
})

app.get('/CreaIncontri_/:sesso/:categorie/:peso/:tatami', function (req, res){
    var sesso = req.params.sesso;
    var peso = req.params.peso;
    var categorie = req.params.categorie;
    var tatami = req.params.tatami;
    eseguiQuery(res, 'call CreaIncontri(?,?,?); insert into Tatami_has_CategoriaEtà(Tatami_idTatami, CategoriaEtà_NomeCategoria, CategoriePeso_idCategoriePeso, Sesso) values(?,?,?,?);',[sesso, categorie, peso, tatami, peso, categorie, sesso]);
})

app.get('/PrendiTatami/', function(req, res){
    eseguiQuery(res, 'select * from Tatami_has_CategoriaEtà join CategoriePeso on CategoriePeso.idCategoriePeso = Tatami_has_CategoriaEtà.CategoriePeso_idCategoriePeso;');
})