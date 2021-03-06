const { assert, expect } = require('chai');
const nock = require('nock');
const request = require('supertest');

const noncommercialPermitApplicationFactory = require('./data/noncommercial-permit-application-factory.es6');
const noncommercialPermitFromDatabaseFactory = require('./data/noncommercial-permit-from-db-factory.es6');
const server = require('./mock-aws.spec.es6');
const vcapConstants = require('../src/vcap-constants.es6');
const noncommercial = require('../src/controllers/special-use/noncommercial.es6');
require('./common.es6');
const { loginAdmin } = require('./data/auth-helper.es6');

const noncommercialUrl = '/permits/applications/special-uses/noncommercial';

let intakeControlNumber;
const invalidIntakeControlNumber = 'ab69a474-aaaa-aaaa-aaaa-e9de93d92c10';
const twoHundredSixtyCharacterString = '123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 ';

describe('noncommercial controllers', () => {
  describe('when not authenticated as an admin', () => {
    it('returns 401', (done) => {
      request(server).post(noncommercialUrl)
        .expect(401, done);
    });
  });

  describe('when authenticated as an admin', () => {
    const agent = request.agent(server);

    before(loginAdmin(agent));

    it('POST should return a 201 status code and an intakeControlNumber', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect(/"applicationId":[\d]+/)
        .expect((res) => {
          intakeControlNumber = res.body.appControlNumber;
        })
        .expect(201, done);
    }).timeout(6000);

    ['AS', 'DC', 'FM', 'GU', 'MH', 'MP', 'PW', 'PR', 'VI'].forEach((value) => {
      it('POST should return a 201 status code and an intakeControlNumber even when a non-State code is entered', (done) => {
        const permitApplication = noncommercialPermitApplicationFactory.create({ 'applicantInfo.primaryAddress.mailingState': value });
        agent
          .post(noncommercialUrl)
          .send(permitApplication)
          .expect('Content-Type', /json/)
          .expect(/"applicationId":[\d]+/)
          .expect((res) => {
            intakeControlNumber = res.body.appControlNumber;
          })
          .expect(201, done);
      }).timeout(6000);
    });

    it('POST should not allow sql injection (little Bobby Tables) to succeed and drop a table. If it succeeds, subsequent tests will fail.', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.applicantInfo.primaryFirstName = 'Robert"); DROP TABLE noncommercialApplications; --';
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('POST should return a 400 status code and an error when the region is missing', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.region = undefined;
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'noncommercialApplications.region cannot be null');
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the region is too long', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.region = '123';
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'region must be 2 characters in length');
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the region is too short', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.region = '1';
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'region must be 2 characters in length');
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the forest is missing', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.forest = undefined;
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'noncommercialApplications.forest cannot be null');
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the forest is too long', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.forest = '123';
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'forest must be 2 characters in length');
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the forest is too short', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.forest = '1';
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'forest must be 2 characters in length');
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the district is missing', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.district = undefined;
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'noncommercialApplications.district cannot be null');
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the district is too long', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.district = '123';
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'district must be 2 characters in length');
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the district is too short', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.district = '1';
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'district must be 2 characters in length');
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the primaryFirstName is missing', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.applicantInfo.primaryFirstName = undefined;
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(
            res.body.errors[0].message,
            'noncommercialApplications.applicantInfoPrimaryFirstName cannot be null'
          );
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the primaryFirstName is too long', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.applicantInfo.primaryFirstName = twoHundredSixtyCharacterString;
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'primaryFirstName must be less than 255 characters in length');
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the primaryLastName is missing', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.applicantInfo.primaryLastName = undefined;
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(
            res.body.errors[0].message,
            'noncommercialApplications.applicantInfoPrimaryLastName cannot be null'
          );
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the primaryLastName is too long', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.applicantInfo.primaryLastName = twoHundredSixtyCharacterString;
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'primaryLastName must be less than 255 characters in length');
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the dayPhoneAreaCode is missing', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.applicantInfo.dayPhone.areaCode = undefined;
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(
            res.body.errors[0].message,
            'noncommercialApplications.applicantInfoDayPhoneAreaCode cannot be null'
          );
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the dayPhoneAreaCode is too long', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.applicantInfo.dayPhone.areaCode = '1234';
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'applicantInfoDayPhoneAreaCode must be 3 characters in length');
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the primaryMailingZip is too long', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.applicantInfo.primaryAddress.mailingZIP = '123456';
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'applicantInfoSecondaryMailingAddress must be 5 characters in length');
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the primaryMailingZip is too short', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.applicantInfo.primaryAddress.mailingZIP = '1234';
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'Validation is on applicantInfoPrimaryMailingZIP failed');
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the primaryMailingZip is not numeric', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.applicantInfo.primaryAddress.mailingZIP = 'ABCDE';
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'Validation is on applicantInfoPrimaryMailingZIP failed');
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the startDateTime is invalid', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.dateTimeRange.startDateTime = '2020-02-31T13:00:00Z';
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'startDateTime must be a valid UTC string');
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the startDateTime is malformed', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.dateTimeRange.startDateTime = '2-02-21T13:00';
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'startDateTime must be a valid UTC string');
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the primaryMailingState is invalid', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.applicantInfo.primaryAddress.mailingState = 'BS';
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'applicantInfoPrimaryMailingState is invalid');
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the email is invalid', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.applicantInfo.emailAddress = 'apples';
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'Validation isEmail on applicantInfoEmailAddress failed');
        })
        .expect(400, done);
    });

    it('POST should return a 400 status code and an error when the orgType is invalid', (done) => {
      const permitApplication = noncommercialPermitApplicationFactory.create();
      permitApplication.applicantInfo.orgType = 'chocolate';
      agent
        .post(noncommercialUrl)
        .send(permitApplication)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'orgType is invalid');
        })
        .expect(400, done);
    });

    it('GET should return a 200 status code with a valid intakeControlNumber', (done) => {
      agent
        .get(`${noncommercialUrl}/${intakeControlNumber}`)
        .expect('Content-Type', /json/)
        .expect(/"applicationId":[\d]+/)
        .expect(200, done);
    });

    it('GET should return a 404 status code when the intakeControlNumber is not found', (done) => {
      agent
        .get(`${noncommercialUrl}/${invalidIntakeControlNumber}`)
        .expect(404, done);
    });

    it('GET should return a 500 status code when the intakeControlNumber is malformed', (done) => {
      agent
        .get(`${noncommercialUrl}/` + 'imalformedControlNumber')
        .expect(500, done);
    });

    it('PUT should return a 200 status code when the status is Submitted', (done) => {
      agent
        .put(`${noncommercialUrl}/${intakeControlNumber}`)
        .send(
          noncommercialPermitApplicationFactory.create({
            status: 'Submitted'
          })
        )
        .expect('Content-Type', /json/)
        .expect(/"applicationId":[\d]+/)
        .expect(200, done);
    }).timeout(3000);

    it('PUT should return a 200 status code when the status is Cancelled', (done) => {
      agent
        .put(`${noncommercialUrl}/${intakeControlNumber}`)
        .send(
          noncommercialPermitApplicationFactory.create({
            status: 'Cancelled'
          })
        )
        .expect('Content-Type', /json/)
        .expect(/"applicationId":[\d]+/)
        .expect(200, done);
    }).timeout(3000);

    it('PUT should return a 200 status code when the status is Rejected', (done) => {
      agent
        .put(`${noncommercialUrl}/${intakeControlNumber}`)
        .send(
          noncommercialPermitApplicationFactory.create({
            status: 'Rejected',
            applicantMessage: 'Rejected, buddy.'
          })
        )
        .expect('Content-Type', /json/)
        .expect(/"applicationId":[\d]+/)
        .expect(200, done);
    }).timeout(3000);

    it('PUT should return a 200 status code when the status is Hold', (done) => {
      agent
        .put(`${noncommercialUrl}/${intakeControlNumber}`)
        .send(
          noncommercialPermitApplicationFactory.create({
            status: 'Hold',
            applicantMessage: 'Hold it, buddy.'
          })
        )
        .expect('Content-Type', /json/)
        .expect(/"applicationId":[\d]+/)
        .expect(200, done);
    }).timeout(3000);

    it('PUT should return a 200 status code when the status is Review', (done) => {
      agent
        .put(`${noncommercialUrl}/${intakeControlNumber}`)
        .send(
          noncommercialPermitApplicationFactory.create({
            status: 'Review'
          })
        )
        .expect('Content-Type', /json/)
        .expect(/"applicationId":[\d]+/)
        .expect(200, done);
    }).timeout(3000);

    it('PUT should return a 400 status code when the status is missing', (done) => {
      agent
        .put(`${noncommercialUrl}/${intakeControlNumber}`)
        .send(
          noncommercialPermitApplicationFactory.create({
            status: undefined
          })
        )
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'noncommercialApplications.status cannot be null');
        })
        .expect(400, done);
    });

    it('PUT should return a 400 status code when the status is Bananas', (done) => {
      agent
        .put(`${noncommercialUrl}/${intakeControlNumber}`)
        .send(
          noncommercialPermitApplicationFactory.create({
            status: 'Bananas'
          })
        )
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.lengthOf(res.body.errors, 1);
          assert.equal(res.body.errors[0].message, 'status is invalid');
        })
        .expect(400, done);
    });

    it('PUT should return a 404 status code when the intakeControlNumber is not found', (done) => {
      agent
        .put(`${noncommercialUrl}/${invalidIntakeControlNumber}`)
        .send(noncommercialPermitApplicationFactory.create())
        .expect(404, done);
    });

    it('PUT should return a 500 status code when status is Accepted and middlelayer authentication fails', (done) => {
      nock.cleanAll();
      nock(vcapConstants.MIDDLE_LAYER_BASE_URL)
        .post('/auth')
        .reply(401, {
          token: 'auth-token'
        });
      nock(vcapConstants.MIDDLE_LAYER_BASE_URL)
        .post('/permits/applications/special-uses/noncommercial/')
        .reply(200, {
          status: 'success'
        });
      agent
        .put(`${noncommercialUrl}/${intakeControlNumber}`)
        .send(
          noncommercialPermitApplicationFactory.create({
            status: 'Accepted'
          })
        )
        .expect(500, done);
    }).timeout(3000);

    it('PUT should return a 500 status code when status is Accepted and the middlelayer POST fails', (done) => {
      nock.cleanAll();
      nock(vcapConstants.MIDDLE_LAYER_BASE_URL)
        .post('/auth')
        .reply(201, {
          token: 'auth-token'
        });
      nock(vcapConstants.MIDDLE_LAYER_BASE_URL)
        .post('/permits/applications/special-uses/noncommercial/')
        .reply(500, {
          status: 'fail'
        });
      agent
        .put(`${noncommercialUrl}/${intakeControlNumber}`)
        .send(
          noncommercialPermitApplicationFactory.create({
            status: 'Accepted'
          })
        )
        .expect(500, done);
    }).timeout(3000);

    it('GET should return a 200 status code, a status of Review and no middle layer control number', (done) => {
      agent
        .get(`${noncommercialUrl}/${intakeControlNumber}`)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.equal(res.body.controlNumber, undefined);
          assert.equal(res.body.status, 'Review');
          assert.equal(res.body.applicantMessage, 'Hold it, buddy.');
        })
        .expect(200, done);
    });

    it('GET should return a 200 status code, a status of Review and no middle layer control number', (done) => {
      agent
        .get(`${noncommercialUrl}/${intakeControlNumber}`)
        .expect('Content-Type', /json/)
        .expect((res) => {
          assert.equal(res.body.controlNumber, undefined);
          assert.equal(res.body.status, 'Review');
        })
        .expect(200, done);
    });

    it('PUT should return a 200 status code when status is Accepted and a successful middle layer POST', (done) => {
      nock.cleanAll();
      nock(vcapConstants.MIDDLE_LAYER_BASE_URL)
        .post('/auth')
        .reply(200, {
          token: 'auth-token'
        });
      nock(vcapConstants.MIDDLE_LAYER_BASE_URL)
        .post('/permits/applications/special-uses/noncommercial/')
        .reply(200, {
          controlNumber: '1999'
        });
      agent
        .put(`${noncommercialUrl}/${intakeControlNumber}`)
        .send(
          noncommercialPermitApplicationFactory.create({
            status: 'Accepted'
          })
        )
        .expect('Content-Type', /json/)
        .expect(/"applicationId":[\d]+/)
        .expect(200, done);
    }).timeout(3000);
  });

  describe('noncommercial controllers revisions', () => {
    const agent = request.agent(server);

    before(loginAdmin(agent));

    it('GET should return a 200 status code, a status of Accepted, a middle layer control number, and a revision history', (done) => {
      setTimeout(() => {
        agent
          .get(`${noncommercialUrl}/${intakeControlNumber}`)
          .expect('Content-Type', /json/)
          .expect((res) => {
            assert.equal(res.body.controlNumber, '1999');
            assert.equal(res.body.status, 'Accepted');
            assert.equal(res.body.revisions.length, 6);
            assert.equal(res.body.revisions[0].status, 'Submitted');
            assert.equal(res.body.revisions[1].status, 'Cancelled');
            assert.equal(res.body.revisions[2].status, 'Rejected');
            assert.equal(res.body.revisions[3].status, 'Hold');
            assert.equal(res.body.revisions[4].status, 'Review');
            assert.equal(res.body.revisions[5].status, 'Accepted');
          })
          .expect(200, done);
      }, 250);
    });

    it('DELETE should return a 404 status code', (done) => {
      agent
        .delete(`${noncommercialUrl}/${intakeControlNumber}`)
        .expect(404, done);
    });
  });
});

describe('unit tests for noncommercial applications', () => {
  it('Existing "Hold" application should be create "Review" status', () => {
    const model = {
      status: 'Hold',
      authEmail: 'test@email.com'
    };
    const user = {
      role: 'user',
      email: 'test@email.com'
    };
    const submittedApplication = noncommercialPermitApplicationFactory.create();
    submittedApplication.status = 'Hold';

    noncommercial.updateApplicationModel(model, submittedApplication, user);
    expect(model.status).to.equal('Review');
  });
  it('Existing "Review" application should keep "Review" status', () => {
    const model = {
      authEmail: 'test@email.com'
    };
    const user = {
      role: 'user',
      email: 'test@email.com'
    };
    const submittedApplication = noncommercialPermitApplicationFactory.create();
    submittedApplication.status = 'Review';

    noncommercial.updateApplicationModel(model, submittedApplication, user);
    expect(model.status).to.equal('Review');
  });
  it('translateFromIntakeToMiddleLayer() function to translate address for "Corporation" org type', () => {
    const noncommercialPermitFromDB = noncommercialPermitFromDatabaseFactory.create();

    const result = noncommercial.translateFromIntakeToMiddleLayer(noncommercialPermitFromDB);
    expect(result.applicantInfo.mailingAddress).to.equal(noncommercialPermitFromDB.applicantInfoOrgMailingAddress);
  });
});
