'use strict';

require('should');

const schema = require('../../src/tools/schema');

describe('schema', () => {

  describe('compileApp on a resource', () => {
    it('should handle blank methods', () => {
      const appRaw = {
        resources: {
          foo: {
            key: 'foo',
            noun: 'Foo',
            hook: {},
            list: {},
            search: {},
            create: {}
          }
        }
      };
      const compiledApp = schema.compileApp(appRaw);
      compiledApp.should.containEql({
        triggers: {},
        creates: {},
        searches: {}
      });
    });

    it('should populate outputFields if available', () => {
      const dummyMethod = {
        operation: {
          perform: () => {return {};}
        }
      };

      const appRaw = {
        resources: {
          foo: {
            key: 'foo',
            noun: 'Foo',
            hook: dummyMethod,
            list: dummyMethod,
            search: dummyMethod,
            create: dummyMethod,
            outputFields: [
              {key: 'id', type: 'integer'},
              {key: 'name', type: 'string'},
            ],
            sample: {
              id: 123,
              name: 'John Doe'
            }
          }
        }
      };
      const compiledApp = schema.compileApp(appRaw);
      compiledApp.triggers.fooList.operation.outputFields.should.have.length(2);
      compiledApp.searches.fooSearch.operation.outputFields.should.have.length(2);
      compiledApp.creates.fooCreate.operation.outputFields.should.have.length(2);
    });

    it("should populate hook's performList from list method if available", () => {
      const appRaw = {
        resources: {
          foo: {
            key: 'foo',
            noun: 'Foo',
            hook: {
              display: {},
              operation: {},
            },
            list: {
              display: {},
              operation: {
                perform: {url: 'http://local.dev/items'}
              },
            },
          }
        }
      };
      const compiledApp = schema.compileApp(appRaw);
      compiledApp.triggers.fooHook.operation.should.containEql({
        performList: {url: 'http://local.dev/items'}
      });
    });

    it("should not overwrite hook's existing performList with list method", () => {
      const appRaw = {
        resources: {
          foo: {
            key: 'foo',
            noun: 'Foo',
            hook: {
              display: {},
              operation: {
                performList: {url: 'http://local.dev/items-for-hook'}
              },
            },
            list: {
              display: {},
              operation: {
                perform: {url: 'http://local.dev/items'}
              },
            },
          }
        }
      };
      const compiledApp = schema.compileApp(appRaw);
      compiledApp.triggers.fooHook.operation.should.containEql({
        performList: {url: 'http://local.dev/items-for-hook'}
      });
    });

    it("should populate search's performGet from get method if available", () => {
      const appRaw = {
        resources: {
          foo: {
            key: 'foo',
            noun: 'Foo',
            get: {
              display: {},
              operation: {
                perform: {url: 'http://local.dev/items/{{bundle.inputData.id}}'},
              }
            },
            search: {
              display: {},
              operation: {},
            },
          }
        }
      };
      const compiledApp = schema.compileApp(appRaw);
      compiledApp.searches.fooSearch.operation.should.containEql({
        performGet: {url: 'http://local.dev/items/{{bundle.inputData.id}}'}
      });
    });

    it("should not overwrite search's existing performGet with get method", () => {
      const appRaw = {
        resources: {
          foo: {
            key: 'foo',
            noun: 'Foo',
            get: {
              display: {},
              operation: {
                perform: {url: 'http://local.dev/items/{{bundle.inputData.id}}'},
              },
            },
            search: {
              display: {},
              operation: {
                performGet: {url: 'http://local.dev/items-for-search/{{bundle.inputData.id}}'}
              },
            },
          }
        }
      };
      const compiledApp = schema.compileApp(appRaw);
      compiledApp.searches.fooSearch.operation.should.containEql({
        performGet: {url: 'http://local.dev/items-for-search/{{bundle.inputData.id}}'}
      });
    });
  });

  describe('compileApp', () => {
    it('should populate hook trigger performList when resource is linked', () => {
      const appRaw = {
        resources: {
          foo: {
            list: {
              display: {},
              operation: {
                perform: {url: 'http://local.dev/items'}
              },
            },
          }
        },
        triggers: {
          fastFoo: {
            key: 'fastFoo',
            noun: 'Foo',
            display: {},
            operation: {
              resource: 'foo',
              type: 'hook',
            }
          }
        }
      };
      const compiledApp = schema.compileApp(appRaw);
      compiledApp.triggers.fastFoo.operation.should.containEql({
        performList: {url: 'http://local.dev/items'}
      });
    });

    it('should populate search with properties from linked resource', () => {
      const appRaw = {
        resources: {
          foo: {
            key: 'foo',
            noun: 'Foo',
            get: {
              display: {},
              operation: {
                perform: {url: 'http://local.dev/items/{{bundle.inputData.id}}'},
              }
            },
            outputFields: [
              {'key': 'id'},
              {'key': 'name'}
            ],
            sample: {
              'id': 123,
              'name': 'John Doe'
            }
          }
        },
        searches: {
          findFoo: {
            display: {},
            operation: {
              resource: 'foo',
            },
          },
        }
      };
      const compiledApp = schema.compileApp(appRaw);
      compiledApp.searches.findFoo.operation.should.containEql({
        performGet: {url: 'http://local.dev/items/{{bundle.inputData.id}}'}
      });
      compiledApp.searches.findFoo.operation.outputFields.should.have.length(2);
      compiledApp.searches.findFoo.operation.sample.should.have.keys('id', 'name');
    });

    it('should populate create with properties from linked resource', () => {
      const appRaw = {
        resources: {
          foo: {
            key: 'foo',
            noun: 'Foo',
            get: {
              display: {},
              operation: {
                perform: {url: 'http://local.dev/items/{{bundle.inputData.id}}'},
              }
            },
            outputFields: [
              {'key': 'id'},
              {'key': 'name'}
            ],
            sample: {
              'id': 123,
              'name': 'John Doe'
            }
          }
        },
        creates: {
          makeFoo: {
            display: {},
            operation: {
              resource: 'foo',
            },
          },
        }
      };
      const compiledApp = schema.compileApp(appRaw);
      compiledApp.creates.makeFoo.operation.should.containEql({
        performGet: {url: 'http://local.dev/items/{{bundle.inputData.id}}'}
      });
      compiledApp.creates.makeFoo.operation.outputFields.should.have.length(2);
      compiledApp.creates.makeFoo.operation.sample.should.have.keys('id', 'name');
    });
  });
});
