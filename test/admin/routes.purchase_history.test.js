const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../../src/app');
const knex = require('../../src/db/knex');
const jwt = require('../../src/jwt/token');
const boxStore = require('../../src/db/boxStore');

const token = jwt.sign(
    {
        userId: 2
    },
    process.env.JWT_ADMIN_SECRET
);

describe('routes: admin purchase history', () => {
    beforeEach(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
    });

    const rootPaths = [
        {
            path: '/api/v1/admin/purchaseHistory',
            description: 'all purchases'
        },
        {
            path: '/api/v1/admin/users/1/purchaseHistory',
            description: 'purchases of a specified user'
        },
        {
            path: '/api/v1/admin/products/8855702006834/purchaseHistory',
            description: 'purchases of a specified product'
        }
    ];

    rootPaths.forEach(({ path, description }) => describe(description, () => {
        describe('list of all purchases', () => {
            it('should return a list of purchases', async () => {
                const res = await chai
                    .request(server)
                    .get(path)
                    .set('Authorization', 'Bearer ' + token);

                expect(res.status).to.equal(200);
                expect(res.body).to.have.key('purchases');
                expect(res.body.purchases).to.be.an('array');

                res.body.purchases.forEach((purchase) => {
                    expect(purchase).to.have.all.keys(
                        'purchaseId',
                        'time',
                        'user',
                        'price',
                        'stockAfter'
                    );

                    expect(purchase.user).to.have.all.keys(
                        'userId',
                        'fullName',
                        'role',
                        'username',
                        'email'
                    );
                });
            });
        });

        describe('query for a specific purchase', () => {
            it('should fail on nonexisting purchase id', async () => {
                const query = await chai
                    .request(server)
                    .get(path + '/0')
                    .set('Authorization', 'Bearer ' + token);

                expect(query.status).to.equal(404);
                expect(query.body.error_code).to.equal('not_found');
            });

            it('should return a purchase', async () => {
                const res = await chai
                    .request(server)
                    .get(path)
                    .set('Authorization', 'Bearer ' + token);

                expect(res.status).to.equal(200);
                expect(res.body.purchases.length).to.not.equal(0);
                const purchaseId = res.body.purchases[0].purchaseId;

                const query = await chai
                    .request(server)
                    .get(path + '/' + purchaseId)
                    .set('Authorization', 'Bearer ' + token);

                expect(query.status).to.equal(200);
                expect(query.body.purchase).to.have.all.keys(
                    'purchaseId',
                    'time',
                    'user',
                    'price',
                    'stockAfter'
                );
                expect(query.body.purchase.user).to.have.all.keys(
                    'userId',
                    'fullName',
                    'role',
                    'username',
                    'email'
                );
            });
        });
    }));
});
