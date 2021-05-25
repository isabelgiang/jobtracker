import request from 'supertest';
import mongoose from 'mongoose';
import { Channel, ChannelModel } from '../models/channel.model';
import App from '../app';

describe('Testing /v1/channels/ endpoints', () => {
    describe('GET /v1/channels/', () => {
        it('happy case', async () => {
            const testChannel = {
                name: 'testChannel',
                description: 'testDescription',
            }

            ChannelModel.find = jest.fn().mockReturnValue({
                _id: "60706478aad6c9ad19a31c84",
                name: testChannel.name,
                description: testChannel.description
            });

            const app = new App; 
            return request(app.getServer())
        });
    })
})

