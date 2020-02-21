const net = require('net');
let socket = null;
let router = null;
const state = {
  error: null,
  timer: null,
  last: null,
  tests: null,
  username: null,
  current: null,
  question: null,
  result: null,
};
const getters = {
  socket: state => socket,
  error: state => state.error,
  tests: state => state.tests,
  username: state => state.username,
  current: state => (state.current) ? state.tests.find(t => t.id === state.current) : null,
  question: state => state.question,
  result: state => state.result,
  last: state => state.last,
};
const mutations = {
  setError(state, payload) {
    state.error = payload.error;
    if (state.timer)
      state.timer.clearTimeout();
    state.timer = payload.timer;
  },
  removeError(state) {
    state.error = null;
    state.timer = null;
  },
  connect(state, payload) {
    socket = payload.socket;
    state.username = payload.username;
    socket.write(JSON.stringify({
      action: 'login',
      params: {
        username: payload.username
      }
    }));
  },
  router(state, payload) {
    router = payload;
  },
  close(state) {
    if (socket)
      socket.destroy();
    state.username = null;
    state.tests = null;
    state.current = null;
    state.question = null;
    state.result = null;
    state.last = null;
  },
  login(state) {
    router.push('/tests');
  },
  last(state, payload) {
    state.last = payload;
  },
  tests(state, payload) {
    state.tests = payload;
  },
  test(state, payload) {
    state.current = payload;
    router.push('/test')
  },
  question(state, payload) {
    state.question = payload;
  },
  result(state, payload) {
    state.result = payload;
  },
  next(state) {
    router.push('/tests');
    state.last = state.result;
    state.current = null;
    state.question = null;
    state.result = null;
  }
} ;
const actions = {
	connect: ({commit, dispatch}, payload) => {
    return new Promise((rs, rj) => {
      const [host, port] = payload.address.split(':');
      const socket = net.createConnection(port, host, () => {
        rs(socket);
      });
      socket.on('error', () => {
        rj('Connection failed!');
      })
    }).then((socket) => {
      commit('connect', { socket, username: payload.username});
      socket.on('data', (data) => {
        const json = JSON.parse(data);
        console.log(json);
        dispatch(json.action, json);
      })
    }).catch((err) => {
      dispatch('error', err);
    })
  },
  error({commit, dispatch}, error) {
	  const timer = setTimeout(() => {
	    commit('removeError');
    }, 3000);
	  commit('setError', {error, timer});
  },
  login({commit, dispatch}, payload) {
	  if (!socket)
	    return dispatch('error', 'Session expired, please log in again');
	  commit('login');
    socket.write(JSON.stringify({
      action: 'tests'
    }));
  },
  tests({commit}, payload) {
    commit('last', payload.params.last);
    commit('tests', payload.params.tests)
  },
  test({commit, getters}, payload) {
	  if (!getters.current || payload !== getters.current.id) {
      socket.write(JSON.stringify({
        action: 'test',
        params: {
          id: payload,
        }
      }));
    }
    commit('test', payload);
  },
  answer({commit}, payload) {
    commit('result', payload.params.result);
    commit('question', payload.params.question)
  },
  sendAnswer({}, payload) {
	  socket.write(JSON.stringify({
      action: 'answer',
      params: {
        answer: payload
      }
    }))
  },
  next({commit}) {
    commit('next');
  },
  close({commit, dispatch}, payload) {
		if (router.history.current.path !== '/')
      router.replace('/');
	  if (payload && payload.message)
	    dispatch('error', payload.message);
	  commit('close');
  },
  router({commit}, router) {
	  commit('router', router);
  }
};

export default {
  state,
  getters,
  mutations,
  actions
}
