exports.seed = function (knex, Promise) {
    return knex('PRICE')
        .del()
        .then(() => {
            return knex('PRICE').insert([
                {
                    barcode: '6411223344556',
                    count: 10,
                    buyprice: 100,
                    sellprice: 180,
                    itemid: 1480,
                    userid: 2,
                    starttime: new Date(),
                    endtime: null
                },
                {
                    barcode: '6465544332211',
                    count: 5,
                    buyprice: 150,
                    sellprice: 200,
                    itemid: 330,
                    userid: 2,
                    starttime: new Date(),
                    endtime: null
                }
            ]);
        });
};