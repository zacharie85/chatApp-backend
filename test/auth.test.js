// test/auth.test.js
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server'); // Replace with the actual path to your server file
const api = process.env.API_URL;
const { expect } = chai;
chai.use(chaiHttp);

describe('Authentication API Tests', () => {
  // Test registration
  it('should register a new user', (done) => {
    chai
      .request(server)
      .post(`${api}/auth/register`)
      .send({ username: 'testuser', password: 'testpassword' })
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('message').to.equal('Registration successful');
        done();
      });
  });

  // Test login
  it('should log in an existing user', (done) => {
    chai
      .request(server)
      .post(`${api}/auth/login`)
      .send({ username: 'testuser', password: 'testpassword' })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('token');
        done();
      });
  });

  // Test login with invalid credentials
  it('should not log in with invalid credentials', (done) => {
    chai
      .request(server)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'wrongpassword' })
      .end((err, res) => {
        expect(res).to.have.status(401);
        expect(res.body).to.have.property('error').to.equal('Invalid credentials');
        done();
      });
  });

  // Add more tests as needed
});
