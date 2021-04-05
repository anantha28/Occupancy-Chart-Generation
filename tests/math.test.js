let chai = require('chai');

let chaiHttp = require('chai-http');

const request = require('express');

let expect = chai.expect;

chai.use(chaiHttp);

describe('Testing my Get method', () => {

    it('should be return status 200 for /', function(done){

        chai

            .request('http://'+process.env.IP+":"+process.env.PORT)

            .get('/login')

            .then(function(res){

                expect(res).to.have.status(200);

                done();

            })

            .catch(function(err){

                throw(err);

            });

    },30000);

});

describe('Testing my Post method', () => {

    it('should be return status 200 for /', function(done){

        chai

            .request('http://'+process.env.IP+":"+process.env.PORT)

            .post('/login')

            .then(function(res){

                expect(res).to.have.status(200);

                done();

            })

            .catch(function(err){

                throw(err);

            });

    },30000);

});