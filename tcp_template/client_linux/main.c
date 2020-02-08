#include <stdio.h>
#include <stdlib.h>

#include <netdb.h>
#include <netinet/in.h>
#include <unistd.h>

#include <string.h>
#include <time.h>

struct Message {
	int length;
	char* message;
};

char* read_msg(int fd) {
	char tmp = '\n';
	int length = 2;
	int curr = 0;
	char * message = malloc(length * sizeof(char));
	do {
		read(fd, &tmp, 1);
		message[curr] = tmp;
		curr++;
		if (curr == length) {
			length *= 2;
			message = realloc(message, length * sizeof(char));
		}
	} while(tmp != '\n' && tmp != '\0');
	message = realloc(message, curr * sizeof(char));
	printf("\033[1A\033[K");
    fflush(stdout);
	return message;
}

void print_with_time(char * message) {
  time_t rawtime;
  struct tm * timeinfo;
  time(&rawtime);
  timeinfo = localtime(&rawtime);
  printf("<%d:%d>%s\n", timeinfo->tm_hour, timeinfo->tm_min, message);
}

char* msg_to(char* nickname, int nick_length, char* message, int message_length) {
	//4 cuz we need null c at the end;
	int length = (nick_length + message_length + 3);
	char* msg = malloc((length + 1) * sizeof(char));
	*msg++ = '[';
	strcpy(msg, nickname);
	msg += nick_length;
	*msg++ = ']';
	*msg++ = ' ';
	strcpy(msg, message);
	msg -= (nick_length + 3);
	msg[length] = '\0';
	return msg;
}

struct Message * read_sock(int fd) {
	//read length on message
	struct Message* m = malloc(sizeof(struct Message));
	char bytes[4];
	read(fd, bytes, 4);
	int len;
	//char[4] -> int
	len = bytes[0] | ((int)bytes[1] << 8) | ((int)bytes[2] << 16) | ((int)bytes[3] << 24);
	//read message
	char message[len];
	m->length = len + 4;
	read(fd, message, len);
	char* msg = malloc((len + 4) * sizeof(char));
	strcpy(msg, bytes);
	strcat(msg, message);
	m->message = msg;
	return m;
}

void print_msg(struct Message * m) {
	print_with_time(m->message);
	free(m->message);
	free(m);
}

int main(int argc, char *argv[]) {
    int sockfd, n;
    uint16_t portno;
    struct sockaddr_in serv_addr;
    struct hostent *server;

		int nick_length = strlen(argv[3]);
		char* nickname = malloc(nick_length * sizeof(char));
		strcpy(nickname, argv[3]);

    if (argc < 4) {
        fprintf(stderr, "usage %s hostname port nickname\n", argv[0]);
        exit(0);
    }

    portno = (uint16_t) atoi(argv[2]);

    /* Create a socket point */
    sockfd = socket(AF_INET, SOCK_STREAM, 0);

    if (sockfd < 0) {
        perror("ERROR opening socket");
        exit(1);
    }

    server = gethostbyname(argv[1]);

    if (server == NULL) {
        fprintf(stderr, "ERROR, no such host\n");
        exit(0);
    }

    bzero((char *) &serv_addr, sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    bcopy(server->h_addr, (char *) &serv_addr.sin_addr.s_addr, (size_t) server->h_length);
    serv_addr.sin_port = htons(portno);

    /* Now connect to the server */
    if (connect(sockfd, (struct sockaddr *) &serv_addr, sizeof(serv_addr)) < 0) {
        perror("ERROR connecting");
        exit(1);
    }

		char* message = read_msg(STDIN_FILENO);
		int message_length = strlen(message);
		char* to = msg_to(nickname, nick_length, message, message_length);
		free(message);
		print_with_time(to);

    /* Send message to the server */
    n = write(sockfd, to, message_length + nick_length + 4);

    if (n < 0) {
        perror("ERROR writing to socket");
        exit(1);
    }

    /* Now read server response */
		print_msg(read_sock(sockfd));


    if (n < 0) {
        perror("ERROR reading from socket");
        exit(1);
    }

    return 0;
}
