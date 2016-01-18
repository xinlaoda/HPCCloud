#!/usr/bin/env python
# -*- coding: utf-8 -*-

###############################################################################
#  Copyright 2016 Kitware Inc.
#
#  Licensed under the Apache License, Version 2.0 ( the "License" );
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
###############################################################################
import cherrypy

from girder.constants import AccessType
from girder.api.rest import loadmodel, getCurrentUser, Resource, getBodyJson
from girder.api.rest import RestException
from girder.api.describe import Description, describeRoute
from girder.api import access
from girder.api.docs import addModel

from .models import schema


class Simulations(Resource):

    def __init__(self):
        super(Simulations, self).__init__()
        self.resourceName = 'simulations'
        self.route('GET', (':id',), self.get)
        self.route('DELETE', (':id',), self.delete)
        self.route('PATCH', (':id',), self.update)
        self.route('POST', (':id', 'clone'), self.clone)
        self.route('GET', (':id', 'steps', ':stepName'), self.get_step)
        self.route('PUT', (':id', 'steps', 'stepName'), self.update_step)

        self._model = self.model('simulation', 'hpccloud')

    @describeRoute(
        Description('Get a simulation')
        .param('id', 'The simulation to get.',
               dataType='string', required=True, paramType='path')
    )
    @access.user
    @loadmodel(model='simulation', plugin='hpccloud', level=AccessType.READ)
    def get(self, simulation, params):
        return simulation

    @describeRoute(
        Description('Delete a simulation')
        .param('id', 'The simulation to delete.',
               dataType='string', required=True, paramType='path')
    )
    @access.user
    @loadmodel(model='simulation', plugin='hpccloud', level=AccessType.WRITE)
    def delete(self, simulation, params):
        user = getCurrentUser()
        self._model.delete(user, simulation)

    addModel('Steps', schema.simulation['properties']['steps'], 'simulations')
    addModel('UpdateProperties', {
        'id': 'UpdateProperties',
        'properties': {
            'name': {'type': 'string', 'description': 'The simulation name.'},
            'steps': {'type': 'Steps', 'description': 'The simulation steps.'}
        }
    }, 'simulations')

    @describeRoute(
        Description('Update a simulation')
        .param('id', 'The simulation to update.',
               dataType='string', required=True, paramType='path')
    )
    @access.user
    @loadmodel(model='simulation', plugin='hpccloud', level=AccessType.WRITE)
    def update(self, simulation, params):
        immutable = ['projectId', 'folderId', 'access', 'userId', '_id',
                     'steps']
        updates = getBodyJson()

        for p in updates:
            if p in immutable:
                raise RestException('\'%s\' is an immutable property' % p, 400)

        user = getCurrentUser()
        name = updates.get('name')

        self._model.update(user, simulation, name=name)

    @describeRoute(
        Description('Clone a simulation')
        .param('id', 'The simulation to clone.',
               dataType='string', required=True, paramType='path')
    )
    @access.user
    @loadmodel(model='simulation', plugin='hpccloud', level=AccessType.READ)
    def clone(self, simulation, params):
        props = getBodyJson()
        self.requireParams(('name', ), props)
        user = getCurrentUser()

        cloned = self._model.clone(user, simulation, props['name'])

        cherrypy.response.status = 201
        cherrypy.response.headers['Location'] = '/simulations/%s' \
            % cloned['_id']

        return cloned

    @describeRoute(
        Description('Get a particular step in a simulation')
        .param('id', 'The simulation containing the step.',
               dataType='string', required=True, paramType='path')
        .param('stepName', 'The step name to gets.',
               dataType='string', required=True, paramType='path')
    )
    @access.user
    @loadmodel(model='simulation', plugin='hpccloud', level=AccessType.READ)
    def get_step(self, simulation, stepName, params):
        if stepName not in simulation.get('steps', {}):
            raise RestException('Simulation %s doesn\'t contain step %s' %
                                (simulation['_id'], stepName), 400)

        return simulation.get('steps', {}).get(stepName)

    @loadmodel(model='simulation', plugin='hpccloud', level=AccessType.WRITE)
    def update_step(self, simulation, stepName, params):
        pass

    @loadmodel(model='simulation', plugin='hpccloud', level=AccessType.READ)
    def download(self, simulations):
        pass
