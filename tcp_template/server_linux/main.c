#include <stdio.h>
#include <stdlib.h>
#include <netdb.h>
#include <netinet/in.h>
#include <unistd.h>
#include <string.h>
#include <pthread.h>
#include <termios.h>
#include <signal.h>

#define max_clients 5
#define port 5001

pthread_mutex_t mutex;
int sockfd;

typedef struct{
    int socket;
} client;

struct Message {
    int length;
    char* message;
};

//Массив клиентов
client *clients[max_clients];

//Счетчик клиентов
//Инициализация текущего счетчика клиентов
int countClients = 0;

void print_with_time(char * message) {
    time_t rawtime;
    struct tm * timeinfo;
    time(&rawtime);
    timeinfo = localtime(&rawtime);
    printf("<%d:%d>%s\n", timeinfo->tm_hour, timeinfo->tm_min, message);
}

void print_msg(struct Message * m) {
    print_with_time(m->message);
    free(m->message);
    free(m);
}

struct Message * read_sock(int fd) {
    //read length on message
    struct Message* m = malloc(sizeof(struct Message));
    char bytes[4];
    printf("%i", fd);
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

void closeClient(int socket){

    pthread_mutex_lock(&mutex);
    close(socket);
    for (int i = 0; i < max_clients; i++){
        if((clients[i] !=NULL)  &&(clients[i]->socket==socket)){
            print_with_time("Client left us");
            clients[i] = NULL;
            break;
        }
    }
    pthread_mutex_unlock(&mutex);
    pthread_exit(NULL);
    countClients--;

}

//Отправка сообщений всем клиентам клиентам, кроме себя
void sendMessageClients(struct Message * message, int socket){
    int n;
    pthread_mutex_lock(&mutex);

    for (int i = 0; i < max_clients; i++){
        if (clients[i] != NULL){
            if (clients[i]->socket != socket){
                n = write(clients[i]->socket, message->message, message->length);
                if (n <= 0){
                    closeClient(clients[i]->socket);
                    clients[i] = NULL;
                }
            }
        }
    }
    print_msg(message);
    pthread_mutex_unlock(&mutex);

}

void* client_thread(void * client_info) {
    client *clientInfo= *(client**) client_info;
    int socket = clientInfo->socket;

    while(1){
        struct Message * message = read_sock(clientInfo->socket);
        sendMessageClients(message, socket);
    }
}
#pragma clang diagnostic pop

void server_exit(int sig) {

}

int main(int argc, char *argv[]) {
    int newsockfd;
    uint16_t portno;
    unsigned int clilen;
    struct sockaddr_in serv_addr, cli_addr;
    ssize_t n;

    signal(SIGINT, server_exit);
    //Инициализация мьютекса
    pthread_mutex_init(&mutex,NULL);

    //Инициализация массива клиентов
    bzero(&clients, sizeof(client) * max_clients);

    //Идентификатор потока
    pthread_t clientTid;

    /* Сокет для прослушивания других клиентов */
    sockfd = socket(AF_INET, SOCK_STREAM, 0);

    if (sockfd < 0) {
        perror("ERROR opening socket");
    }

    /*Инициализируем сервер*/
    bzero((char *) &serv_addr, sizeof(serv_addr));
    portno = port;

    serv_addr.sin_family = AF_INET;
    serv_addr.sin_addr.s_addr = INADDR_ANY;
    serv_addr.sin_port = htons(portno);

    /* Now bind the host address using bind() call.*/
    if (bind(sockfd, (struct sockaddr *) &serv_addr, sizeof(serv_addr)) < 0) {
        perror("ERROR on binding");
        exit(1);
    }

    listen(sockfd, max_clients);
    clilen = sizeof(cli_addr);

    //Работа сервера
    while (1){

        /* Сокет для приёма новых клиентов */
        newsockfd = accept(sockfd, (struct sockaddr *) &cli_addr, &clilen);
        client* newClientInfo = (client*) malloc(sizeof(client));

        if (newsockfd < 0) {
            perror("ERROR on accept");
            exit(1);
        }
        else {
            pthread_mutex_lock(&mutex);

            print_with_time("New client connected");

            newClientInfo->socket = newsockfd;

            //Добавление нового клиента в массив клиентов
            for (int i = 0; i <= countClients; i++){
                if (clients[i] == NULL){
                    clients[i] = newClientInfo;
                    break;
                }
            }

            pthread_mutex_unlock(&mutex);

            //Создаем поток для клиента
            pthread_create(&clientTid, NULL, client_thread, &newClientInfo);

            countClients++;
        }

    }

    return 0;
}
