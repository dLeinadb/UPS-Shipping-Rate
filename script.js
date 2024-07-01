document.getElementById('shipping-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const zip = document.getElementById('zip').value;
    const weight = document.getElementById('weight').value;

    const client_id = 'g1HA7xXXjc7tejnGAepIDekQ8MCuOPqx3XsCO0Je8byUT1Tv';
    const client_secret = 'Ha2PVe5GER2GPia5dn5oB08mZkkU6IKveLAYDSFIzEGr5j6DmiIqEV8xZJp5sG0d';
    const ups_account_number = 'J138G4';

    const package_info = {
        service: '02',
        package_type: '02',
        Weight: weight,
        length: '7',
        width: '4',
        height: '2',
    };

    const shipper_info = {
        account_number: ups_account_number,
        name: 'Mr. President',
        address1: '1600 Pennsylvania Avenue NW',
        address2: '',
        address3: '',
        city: 'Washington',
        state: 'DC',
        zip: '20500',
        country: 'us',
    };

    const from_address_info = {
        name: 'Mr. President',
        address1: '1600 Pennsylvania Avenue NW',
        address2: '',
        address3: '',
        city: 'Washington',
        state: 'DC',
        zip: '20500',
        country: 'us',
    };

    const to_address_info = {
        name: 'Thomas Jefferson',
        address1: '931 Thomas Jefferson Parkway',
        address2: '',
        address3: '',
        city: '',
        state: '',
        zip: zip,
        country: 'US',
    };

    try {
        const accessToken = await getToken(client_id, client_secret);
        const totalCharges = await getShippingCost(accessToken, shipper_info, to_address_info, from_address_info, package_info);
        document.getElementById('result').innerText = `Total Charges: $${totalCharges}`;
    } catch (error) {
        document.getElementById('result').innerText = 'Error calculating shipping cost. Please try again.';
        console.error(error);
    }
});

async function getToken() {
    const response = await fetch('http://localhost:3000/get-token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    const json = await response.json();
    return json.access_token;
}

async function getShippingCost(accessToken, shipper_info, to_address_info, from_address_info, package_info) {
    const url = 'https://wwwcie.ups.com/api/rating/v1/Rate';

    const payload = {
        RateRequest: {
            Request: {
                TransactionReference: {
                    CustomerContext: 'CustomerContext'
                }
            },
            Shipment: {
                Shipper: {
                    Name: shipper_info.name,
                    ShipperNumber: shipper_info.account_number,
                    Address: {
                        AddressLine: [shipper_info.address1, shipper_info.address2, shipper_info.address3],
                        City: shipper_info.city,
                        StateProvinceCode: shipper_info.state,
                        PostalCode: shipper_info.zip,
                        CountryCode: shipper_info.country,
                    }
                },
                ShipTo: {
                    Name: to_address_info.name,
                    Address: {
                        AddressLine: [to_address_info.address1, to_address_info.address2, to_address_info.address3],
                        City: to_address_info.city,
                        StateProvinceCode: to_address_info.state,
                        PostalCode: to_address_info.zip,
                        CountryCode: to_address_info.country,
                    }
                },
                ShipFrom: {
                    Name: from_address_info.name,
                    Address: {
                        AddressLine: [from_address_info.address1, from_address_info.address2, from_address_info.address3],
                        City: from_address_info.city,
                        StateProvinceCode: from_address_info.state,
                        PostalCode: from_address_info.zip,
                        CountryCode: from_address_info.country,
                    }
                },
                PaymentDetails: {
                    ShipmentCharge: {
                        Type: '01',
                        BillShipper: {
                            AccountNumber: shipper_info.account_number,
                        }
                    }
                },
                Service: {
                    Code: package_info.service,
                    Description: 'ground'
                },
                Package: {
                    PackagingType: {
                        Code: package_info.package_type,
                        Description: 'Packaging'
                    },
                    Dimensions: {
                        UnitOfMeasurement: {
                            Code: 'IN',
                            Description: 'Inches'
                        },
                        Length: package_info.length,
                        Width: package_info.width,
                        Height: package_info.height
                    },
                    PackageWeight: {
                        UnitOfMeasurement: {
                            Code: 'LBS',
                            Description: 'Pounds'
                        },
                        Weight: package_info.Weight
                    }
                }
            }
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json',
            'transId': 'string',
            'transactionSrc': 'testing',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(payload),
    });

    const json = await response.json();

    if (json.RateResponse && json.RateResponse.RatedShipment && json.RateResponse.RatedShipment.TotalCharges) {
        return json.RateResponse.RatedShipment.TotalCharges.MonetaryValue;
    } else {
        throw new Error('Failed to retrieve total charges from the response');
    }
}
